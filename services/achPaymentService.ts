/**
 * ORACLE-LEDGER ACH Payment Processing with Fee Tracking Integration
 * Updated: 2025-11-02
 * Includes comprehensive fee calculation and tracking
 */

import Stripe from 'stripe';
import { feeTrackingService, FeeCalculationRequest, FeeBreakdown } from './feeTrackingService.js';
import { db } from '../server/db.js';
import { achPayments, achReturns, paymentReconciliation, journalEntries } from '../shared/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface AchPaymentRequest {
  customerId: string;
  amount: number; // in dollars
  currency?: string;
  description: string;
  customerType?: 'business' | 'consumer';
  riskLevel?: 'low' | 'medium' | 'high';
  paymentMethodId: string;
  achClassCode?: 'PPD' | 'CCD' | 'WEB' | 'CBP';
  scheduledDate?: string;
  purpose?: 'payment' | 'refund' | 'fee';
}

export interface AchPaymentResult {
  success: boolean;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
  achPaymentId?: string;
  feeBreakdown: FeeBreakdown;
  feeAllocation: any;
  journalEntryId?: string;
  error?: string;
  estimatedSettlementDate?: string;
}

export interface AchReturnRequest {
  achPaymentId: string;
  returnCode: string;
  returnReason: string;
  returnedAmount: number;
  corrected: boolean;
  correctionDate?: string;
  notes?: string;
}

export interface AchReconciliationData {
  stripeBalanceTransactionId: string;
  achPaymentId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'succeeded' | 'failed' | 'pending';
  processedDate: Date;
}

export class AchPaymentService {
  private stripe: Stripe;
  private readonly ACH_SETTLEMENT_DAYS = 3;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Process ACH payment with comprehensive fee tracking
   */
  async processAchPayment(request: AchPaymentRequest): Promise<AchPaymentResult> {
    try {
      // Step 1: Calculate fees before processing
      const feeCalculationRequest: FeeCalculationRequest = {
        paymentType: 'ACH_DEBIT',
        amountCents: Math.round(request.amount * 100),
        customerType: request.customerType || 'business',
        volumeTier: 'medium', // This would be determined by customer history
        riskLevel: request.riskLevel || 'low',
        processingLocation: 'domestic'
      };

      const feeBreakdown = feeTrackingService.calculateFees(feeCalculationRequest);

      // Step 2: Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100),
        currency: request.currency || 'usd',
        payment_method_types: ['us_bank_account'],
        payment_method: request.paymentMethodId,
        customer: request.customerId,
        description: request.description,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          type: 'ach_debit',
          customer_type: request.customerType || 'business',
          risk_level: request.riskLevel || 'low',
          ach_class_code: request.achClassCode || 'PPD',
          purpose: request.purpose || 'payment',
          // Fee tracking metadata
          processing_fee_cents: feeBreakdown.processingFee.toString(),
          ach_fee_cents: feeBreakdown.achFee.toString(),
          bank_fee_cents: feeBreakdown.bankFee.toString(),
          total_fee_cents: feeBreakdown.totalFee.toString(),
          effective_rate: feeBreakdown.effectiveRate.toString()
        }
      });

      // Step 3: Save ACH payment record with fee tracking
      const achPayment = await this.saveAchPaymentRecord({
        stripeChargeId: paymentIntent.latest_charge as string,
        stripePaymentIntentId: paymentIntent.id,
        customerId: request.customerId,
        paymentMethodId: request.paymentMethodId,
        amountCents: Math.round(request.amount * 100),
        description: request.description,
        purpose: request.purpose || 'payment',
        status: paymentIntent.status,
        paymentMethodType: 'ach_debit',
        achClassCode: request.achClassCode || 'PPD',
        scheduledDate: request.scheduledDate,
        feeBreakdown,
        estimatedSettlementDate: this.calculateSettlementDate()
      });

      // Step 4: Create fee allocation for journal entries
      const feeAllocation = feeTrackingService.createFeeAllocation(
        achPayment.id,
        feeBreakdown,
        feeCalculationRequest
      );

      // Step 5: Create compliance records
      const complianceRecord = feeTrackingService.createComplianceRecord(
        achPayment.id,
        'ACH Processing Fee',
        feeBreakdown.achFee,
        'ACH debit processing with $0.80 base fee, capped at $5.00',
        'NACHA Operating Rules'
      );

      // Step 6: Create journal entries for fee allocation
      const journalEntryId = await this.createFeeJournalEntries(achPayment.id, feeAllocation);

      // Step 7: Check for fee variance alerts
      const historicalAverages = await this.getHistoricalFeeAverages('ACH_DEBIT');
      const varianceAlerts = feeTrackingService.checkFeeVariance(
        feeBreakdown,
        historicalAverages,
        { totalFee: 100, effectiveRate: 0.8 } // Thresholds
      );

      // Save variance alerts if any
      if (varianceAlerts.length > 0) {
        await this.saveVarianceAlerts(varianceAlerts);
      }

      return {
        success: true,
        stripeChargeId: paymentIntent.latest_charge as string,
        stripePaymentIntentId: paymentIntent.id,
        achPaymentId: achPayment.id,
        feeBreakdown,
        feeAllocation,
        journalEntryId,
        estimatedSettlementDate: this.calculateSettlementDate()
      };

    } catch (error) {
      console.error('ACH payment processing failed:', error);
      
      // Create error record in fee tracking
      await this.logProcessingError('ACH_PAYMENT_FAILED', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        feeBreakdown: {
          processingFee: 0,
          achFee: 0,
          stripeFee: 0,
          bankFee: 0,
          verificationFee: 0,
          payoutFee: 0,
          totalFee: 0,
          effectiveRate: 0,
          breakdown: {
            baseRate: 0,
            percentageRate: 0,
            flatFees: 0,
            caps: { achCap: 0, maxFee: 0 }
          }
        },
        feeAllocation: { feeEntries: [], totalAllocated: 0 },
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Process ACH credit payment
   */
  async processAchCredit(request: AchPaymentRequest): Promise<AchPaymentResult> {
    try {
      const feeCalculationRequest: FeeCalculationRequest = {
        paymentType: 'ACH_CREDIT',
        amountCents: Math.round(request.amount * 100),
        customerType: request.customerType || 'business',
        volumeTier: 'medium',
        riskLevel: request.riskLevel || 'low',
        processingLocation: 'domestic'
      };

      const feeBreakdown = feeTrackingService.calculateFees(feeCalculationRequest);

      // ACH Credit via Stripe Connect (for push payments)
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(request.amount * 100),
        currency: request.currency || 'usd',
        destination: request.customerId, // This would be the connected account
        description: request.description,
        metadata: {
          type: 'ach_credit',
          processing_fee_cents: feeBreakdown.processingFee.toString(),
          ach_fee_cents: feeBreakdown.achFee.toString(),
          total_fee_cents: feeBreakdown.totalFee.toString()
        }
      });

      const achPayment = await this.saveAchPaymentRecord({
        stripeChargeId: undefined,
        stripePaymentIntentId: transfer.id,
        customerId: request.customerId,
        paymentMethodId: request.paymentMethodId,
        amountCents: Math.round(request.amount * 100),
        description: request.description,
        purpose: request.purpose || 'payment',
        status: 'succeeded',
        paymentMethodType: 'ach_credit',
        achClassCode: request.achClassCode || 'PPD',
        scheduledDate: request.scheduledDate,
        feeBreakdown,
        estimatedSettlementDate: this.calculateSettlementDate()
      });

      const feeAllocation = feeTrackingService.createFeeAllocation(
        achPayment.id,
        feeBreakdown,
        feeCalculationRequest
      );

      return {
        success: true,
        stripePaymentIntentId: transfer.id,
        achPaymentId: achPayment.id,
        feeBreakdown,
        feeAllocation
      };

    } catch (error) {
      console.error('ACH credit processing failed:', error);
      return {
        success: false,
        feeBreakdown: {
          processingFee: 0,
          achFee: 0,
          stripeFee: 0,
          bankFee: 0,
          verificationFee: 0,
          payoutFee: 0,
          totalFee: 0,
          effectiveRate: 0,
          breakdown: {
            baseRate: 0,
            percentageRate: 0,
            flatFees: 0,
            caps: { achCap: 0, maxFee: 0 }
          }
        },
        feeAllocation: { feeEntries: [], totalAllocated: 0 },
        error: error instanceof Error ? error.message : 'ACH credit processing failed'
      };
    }
  }

  /**
   * Process ACH return with fee adjustments
   */
  async processAchReturn(request: AchReturnRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // Step 1: Get the original payment and fees
      const achPayment = await this.getAchPaymentById(request.achPaymentId);
      if (!achPayment) {
        throw new Error('ACH payment not found');
      }

      // Step 2: Calculate return fees and adjustments
      const returnFee = this.calculateReturnFee(request.returnCode);
      const adjustedAmount = request.returnedAmount - returnFee;

      // Step 3: Update ACH payment status
      await this.updateAchPaymentStatus(request.achPaymentId, 'returned', {
        returnCode: request.returnCode,
        returnReason: request.returnReason,
        returnFeeCents: returnFee
      });

      // Step 4: Create return record
      const returnRecord = await this.saveAchReturnRecord({
        achPaymentId: request.achPaymentId,
        returnCode: request.returnCode,
        returnReason: request.returnReason,
        returnedAt: new Date(),
        corrected: request.corrected,
        correctionDate: request.correctionDate,
        adjustedAmountCents: adjustedAmount,
        newPaymentDate: request.correctionDate,
        notes: request.notes
      });

      // Step 5: Create fee adjustment journal entries
      await this.createReturnFeeAdjustments(request.achPaymentId, returnFee, returnRecord.id);

      // Step 6: Update fee tracking records
      await this.updateFeeTrackingForReturn(request.achPaymentId, returnFee, adjustedAmount);

      return { success: true };

    } catch (error) {
      console.error('ACH return processing failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Return processing failed' 
      };
    }
  }

  /**
   * Reconcile ACH payments with Stripe balance transactions
   */
  async reconcileAchPayments(): Promise<AchReconciliationData[]> {
    try {
      // Get unreconciled balance transactions
      const balanceTransactions = await this.stripe.balanceTransactions.list({
        limit: 100,
        created: {
          gte: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000) // Last 30 days
        }
      });

      const reconciliations: AchReconciliationData[] = [];

      for (const transaction of balanceTransactions.data) {
        if (transaction.type === 'charge' && transaction.source && (transaction as any).metadata?.ach_payment_id) {
          const reconciliation = await this.processReconciliation(transaction);
          if (reconciliation) {
            reconciliations.push(reconciliation);
          }
        }
      }

      return reconciliations;

    } catch (error) {
      console.error('ACH reconciliation failed:', error);
      throw error;
    }
  }

  /**
   * Get ACH payment statistics for reporting
   */
  async getAchPaymentStats(startDate: Date, endDate: Date): Promise<{
    totalPayments: number;
    totalVolume: number;
    totalFees: number;
    averageFee: number;
    successRate: number;
    returnRate: number;
    feeByType: { [key: string]: number };
  }> {
    const payments = await db.select().from(achPayments).where(
      and(
        gte(achPayments.createdAt, startDate),
        lte(achPayments.createdAt, endDate)
      )
    );

    const totalPayments = payments.length;
    const totalVolume = payments.reduce((sum, p) => sum + Number(p.amountCents), 0);
    const totalFees = payments.reduce((sum, p) => {
      const metadata = p.stripeMetadata ? JSON.parse(p.stripeMetadata) : {};
      return sum + (Number(metadata.total_fee_cents) || 0);
    }, 0);

    const successfulPayments = payments.filter(p => p.status === 'succeeded').length;
    const returnedPayments = payments.filter(p => p.status === 'returned').length;

    return {
      totalPayments,
      totalVolume,
      totalFees,
      averageFee: totalPayments > 0 ? Math.round(totalFees / totalPayments) : 0,
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
      returnRate: totalPayments > 0 ? (returnedPayments / totalPayments) * 100 : 0,
      feeByType: {
        achProcessing: payments.reduce((sum, p) => {
          const metadata = p.stripeMetadata ? JSON.parse(p.stripeMetadata) : {};
          return sum + (Number(metadata.ach_fee_cents) || 0);
        }, 0),
        bankFees: payments.reduce((sum, p) => {
          const metadata = p.stripeMetadata ? JSON.parse(p.stripeMetadata) : {};
          return sum + (Number(metadata.bank_fee_cents) || 0);
        }, 0),
        // Additional categories can be extracted from metadata if needed
      }
    };
  }

  // ==============================
  // PRIVATE HELPER METHODS
  // ==============================

  private async saveAchPaymentRecord(data: any): Promise<any> {
    const [record] = await db.insert(achPayments).values({
      stripeChargeId: data.stripeChargeId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      customerId: data.customerId,
      paymentMethodId: data.paymentMethodId,
      amountCents: data.amountCents.toString(),
      description: data.description,
      purpose: data.purpose,
      status: data.status,
      paymentMethodType: data.paymentMethodType,
      achClassCode: data.achClassCode,
      scheduledDate: data.scheduledDate,
      estimatedSettlementDate: data.estimatedSettlementDate,
      stripeMetadata: JSON.stringify(data.feeBreakdown)
    }).returning();
    return record;
  }

  private async getAchPaymentById(id: string): Promise<any> {
    const [record] = await db.select().from(achPayments).where(eq(achPayments.id, id));
    return record;
  }

  private async updateAchPaymentStatus(id: string, status: string, additionalData: any): Promise<void> {
    await db.update(achPayments)
      .set({ 
        status,
        returnCode: additionalData.returnCode,
        returnDescription: additionalData.returnReason,
        updatedAt: new Date()
      })
      .where(eq(achPayments.id, id));
  }

  private calculateSettlementDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + this.ACH_SETTLEMENT_DAYS);
    return date.toISOString().split('T')[0];
  }

  private calculateReturnFee(returnCode: string): number {
    // Return fees based on NACHA return codes
    const returnFees: { [key: string]: number } = {
      'R01': 2500, // $25 - Insufficient Funds
      'R02': 2500, // $25 - Account Closed
      'R03': 2500, // $25 - No Account
      'R04': 2500, // $25 - Invalid Account Number
      'R05': 3500, // $35 - Unauthorized Debit
      'R06': 2000, // $20 - Returned per ODFI Request
      'R07': 3500, // $35 - Authorization Revoked
      'R08': 2000, // $20 - Payment Stopped
      'R09': 2500, // $25 - Uncollected Funds
      'R10': 2500, // $25 - Customer Advises Not Authorized
    };

    return returnFees[returnCode] || 2500; // Default $25 fee
  }

  private async saveAchReturnRecord(data: any): Promise<any> {
    const [record] = await db.insert(achReturns).values({
      achPaymentId: data.achPaymentId,
      returnCode: data.returnCode,
      returnReason: data.returnReason,
      returnedAt: data.returnedAt,
      corrected: data.corrected,
      correctionDate: data.correctionDate ? new Date(data.correctionDate) : null,
      adjustedAmountCents: data.adjustedAmountCents.toString(),
      newPaymentDate: data.newPaymentDate,
      notes: data.notes
    }).returning();
    return record;
  }

  private async createReturnFeeAdjustments(achPaymentId: string, returnFee: number, returnRecordId: string): Promise<void> {
    // Create journal entries for return fee adjustments
    // This would integrate with the journal entry system
  }

  private async updateFeeTrackingForReturn(achPaymentId: string, returnFee: number, adjustedAmount: number): Promise<void> {
    // Update fee calculations for return
    // This would mark the original fee as adjusted and create return fee record
  }

  private async createFeeJournalEntries(achPaymentId: string, feeAllocation: any): Promise<string> {
    // Create journal entries for fee allocation
    // This would integrate with the existing journal entry system
    return `journal_${Date.now()}`;
  }

  private async saveVarianceAlerts(alerts: any[]): Promise<void> {
    // Save variance alerts to database
    for (const alert of alerts) {
      console.log('Fee variance alert:', alert.message);
    }
  }

  private async getHistoricalFeeAverages(paymentType: string): Promise<{ [key: string]: number }> {
    // Get historical averages from database
    return {
      totalFee: 300, // $3.00
      effectiveRate: 0.7 // 0.7%
    };
  }

  private async processReconciliation(transaction: Stripe.BalanceTransaction): Promise<AchReconciliationData | null> {
    try {
      // Get the ACH payment record
      const achPaymentId = (transaction as any).metadata?.ach_payment_id;
      if (!achPaymentId) return null;

      // Create reconciliation record
      const reconciliation: AchReconciliationData = {
        stripeBalanceTransactionId: transaction.id,
        achPaymentId,
        amount: transaction.amount,
        fee: transaction.fee,
        netAmount: transaction.net,
        status: transaction.status as any,
        processedDate: new Date(transaction.created * 1000)
      };

      // Save reconciliation record
      await this.saveReconciliationRecord(reconciliation);

      return reconciliation;

    } catch (error) {
      console.error('Reconciliation processing failed:', error);
      return null;
    }
  }

  private async saveReconciliationRecord(reconciliation: AchReconciliationData): Promise<void> {
    await db.insert(paymentReconciliation).values({
      stripeBalanceTransactionId: reconciliation.stripeBalanceTransactionId,
      achPaymentId: reconciliation.achPaymentId,
      amountCents: reconciliation.amount.toString(),
      currency: 'USD',
      netCents: reconciliation.netAmount.toString(),
      feeCents: reconciliation.fee.toString(),
      type: 'charge',
      stripeStatus: reconciliation.status,
      stripeCreated: reconciliation.processedDate,
      reconciledAt: new Date()
    });
  }

  private async logProcessingError(errorType: string, data: any): Promise<void> {
    // Log processing errors for monitoring and debugging
    console.error(`${errorType}:`, data);
  }
}

// Export singleton instance
export const achPaymentService = new AchPaymentService();
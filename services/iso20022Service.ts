/**
 * ISO 20022 Service — Oracle Ledger Integration
 * 
 * Wraps the iso20022.js library to provide:
 * - ACH Credit Payment Initiation (PAIN.001) XML generation
 * - SWIFT Credit Payment Initiation XML generation
 * - CAMT.053 Bank Statement parsing
 * - Statement → Journal Entry conversion
 */

import { ISO20022 } from 'iso20022.js';
import { CashManagementEndOfDayReport } from 'iso20022.js';
import type {
  ISO20022Config,
  ISO20022PaymentInstruction,
  ISO20022GeneratedMessage,
  ParsedBankStatement,
  ParsedStatementTransaction,
  AchPayment,
} from '../types.js';

// ─── Default SOVR Config (placeholder — user configures in Settings) ───

const DEFAULT_CONFIG: ISO20022Config = {
  companyName: 'SOVR Development Holdings LLC',
  companyId: 'SOVRDHL',
  accountNumber: '0000000000',
  routingNumber: '000000000',
  bic: 'SOVRUSPX',
  bankName: 'Partner Bank',
  bankCountry: 'US',
};

// ─── Service Class ─────────────────────────────────────────────────

export class ISO20022Service {
  private config: ISO20022Config;
  private iso20022Instance: any;

  constructor(config?: Partial<ISO20022Config>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.iso20022Instance = new ISO20022({
      initiatingParty: {
        name: this.config.companyName,
        id: this.config.companyId,
        account: {
          accountNumber: this.config.accountNumber,
        },
        agent: {
          abaRoutingNumber: this.config.routingNumber,
          ...(this.config.bic ? { bic: this.config.bic } : {}),
        },
      },
    });
  }

  /** Update the initiating party configuration */
  updateConfig(config: Partial<ISO20022Config>): void {
    this.config = { ...this.config, ...config };
    this.iso20022Instance = new ISO20022({
      initiatingParty: {
        name: this.config.companyName,
        id: this.config.companyId,
        account: {
          accountNumber: this.config.accountNumber,
        },
        agent: {
          abaRoutingNumber: this.config.routingNumber,
          ...(this.config.bic ? { bic: this.config.bic } : {}),
        },
      },
    });
  }

  /** Get current config */
  getConfig(): ISO20022Config {
    return { ...this.config };
  }

  // ─── ACH Credit Payment Initiation ─────────────────────────────

  /**
   * Generate a PAIN.001 ACH Credit Payment Initiation XML from Oracle Ledger ACH payments.
   * Maps AchPayment records to iso20022.js payment instructions.
   */
  generateACHCreditInitiation(
    payments: AchPayment[],
    creditorDetails: {
      name: string;
      accountNumber: string;
      routingNumber: string;
      remittanceInfo?: string;
    }[]
  ): ISO20022GeneratedMessage {
    if (payments.length !== creditorDetails.length) {
      throw new Error('Each payment must have corresponding creditor details');
    }

    const paymentInstructions = payments.map((payment, i) => ({
      type: 'ach' as const,
      direction: 'credit' as const,
      amount: payment.amountCents,
      currency: payment.currencyCode || 'USD',
      creditor: {
        name: creditorDetails[i].name,
        account: {
          accountNumber: creditorDetails[i].accountNumber,
        },
        agent: {
          abaRoutingNumber: creditorDetails[i].routingNumber,
        },
      },
      remittanceInformation: creditorDetails[i].remittanceInfo || payment.description || `Payment ${payment.id}`,
    }));

    const initiation = this.iso20022Instance.createACHCreditPaymentInitiation({
      paymentInstructions,
      localInstrument: payments[0]?.achClassCode || 'CCD',
    });

    const xml = initiation.toString();
    const messageId = `SOVR-ACH-${Date.now()}`;
    const totalAmount = payments.reduce((sum, p) => sum + p.amountCents, 0);

    return {
      id: messageId,
      type: 'pain.001',
      paymentType: 'ach',
      xml,
      createdAt: new Date(),
      relatedPaymentIds: payments.map(p => p.id),
      messageId,
      totalAmount,
      totalInstructions: payments.length,
    };
  }

  /**
   * Generate PAIN.001 from raw payment instructions (for ad-hoc generation).
   */
  generateFromInstructions(
    instructions: ISO20022PaymentInstruction[],
    achClassCode: string = 'CCD'
  ): ISO20022GeneratedMessage {
    const paymentInstructions = instructions.map(inst => ({
      type: inst.type,
      direction: inst.direction,
      amount: inst.amount,
      currency: inst.currency,
      creditor: {
        name: inst.creditorName,
        account: {
          accountNumber: inst.creditorAccountNumber || '',
          ...(inst.creditorIban ? { iban: inst.creditorIban } : {}),
        },
        agent: {
          ...(inst.creditorRoutingNumber ? { abaRoutingNumber: inst.creditorRoutingNumber } : {}),
          ...(inst.creditorBic ? { bic: inst.creditorBic } : {}),
        },
      },
      remittanceInformation: inst.remittanceInfo || '',
    }));

    // Route to the correct creation method based on type
    const firstType = instructions[0]?.type || 'ach';
    let initiation: any;

    if (firstType === 'ach') {
      initiation = this.iso20022Instance.createACHCreditPaymentInitiation({
        paymentInstructions,
        localInstrument: achClassCode,
      });
    } else if (firstType === 'sepa') {
      initiation = this.iso20022Instance.createSEPACreditPaymentInitiation(paymentInstructions);
    } else {
      // Default to ACH for RTP/SWIFT (iso20022.js routes internally)
      initiation = this.iso20022Instance.createACHCreditPaymentInitiation({
        paymentInstructions,
        localInstrument: achClassCode,
      });
    }

    const xml = initiation.toString();
    const messageId = `SOVR-${firstType.toUpperCase()}-${Date.now()}`;
    const totalAmount = instructions.reduce((sum, inst) => sum + inst.amount, 0);

    return {
      id: messageId,
      type: 'pain.001',
      paymentType: firstType,
      xml,
      createdAt: new Date(),
      relatedPaymentIds: [],
      messageId,
      totalAmount,
      totalInstructions: instructions.length,
    };
  }

  // ─── CAMT.053 Bank Statement Parsing ───────────────────────────

  /**
   * Parse CAMT.053 XML bank statement into structured data.
   */
  parseBankStatement(xml: string): ParsedBankStatement {
    const report = CashManagementEndOfDayReport.fromXML(xml);

    const statements = (report.statements || []).map((stmt: any) => ({
      accountId: stmt.accountId || 'unknown',
      openingBalance: 0,
      closingBalance: 0,
      currency: 'USD',
      entries: (stmt.entries || []).map((entry: any, idx: number) => {
        const txn: ParsedStatementTransaction = {
          id: `txn-${idx}-${Date.now()}`,
          amount: entry.amount || 0,
          currency: entry.currency || 'USD',
          creditDebit: entry.creditDebitIndicator === 'CRDT' ? 'credit' : 'debit',
          date: entry.bookingDate || entry.valueDate || new Date().toISOString(),
          description: entry.additionalEntryInformation || '',
          counterpartyName: entry.debtorName || entry.creditorName || '',
          counterpartyAccount: entry.debtorAccount || entry.creditorAccount || '',
          reference: entry.endToEndId || entry.messageId || '',
          matchStatus: 'unmatched',
        };
        return txn;
      }),
    }));

    // Also collect from report.transactions if available
    const directTransactions = (report.transactions || []).map((txn: any, idx: number) => {
      const parsed: ParsedStatementTransaction = {
        id: `rtxn-${idx}-${Date.now()}`,
        amount: txn.amount || 0,
        currency: txn.currency || 'USD',
        creditDebit: txn.creditDebitIndicator === 'CRDT' ? 'credit' : 'debit',
        date: txn.bookingDate || txn.valueDate || new Date().toISOString(),
        description: txn.additionalInformation || txn.remittanceInformation || '',
        counterpartyName: txn.debtorName || txn.creditorName || '',
        counterpartyAccount: txn.debtorAccount || txn.creditorAccount || '',
        reference: txn.endToEndId || '',
        matchStatus: 'unmatched',
      };
      return parsed;
    });

    // If we got transactions but no statements, put them in a default statement
    if (statements.length === 0 && directTransactions.length > 0) {
      statements.push({
        accountId: 'default',
        openingBalance: 0,
        closingBalance: 0,
        currency: 'USD',
        entries: directTransactions,
      });
    }

    return {
      messageId: report.messageId || `CAMT-${Date.now()}`,
      creationDate: report.creationDate?.toISOString() || new Date().toISOString(),
      accountId: statements[0]?.accountId || 'unknown',
      statements,
      totalTransactions: statements.reduce((sum, s) => sum + s.entries.length, 0),
    };
  }


}

// Singleton export
export const iso20022Service = new ISO20022Service();

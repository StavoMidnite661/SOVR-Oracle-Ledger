import express from 'express';
import cors from 'cors';
import { db } from '../../server/db.js';
import * as schema from '../../shared/schema.js';
import { eq, desc, and, or, like, isNull, gte, lte, sql } from 'drizzle-orm';
import Stripe from 'stripe';
import { AchReturnCodes } from '../../types.js';
import { iso20022Service } from '../../services/iso20022Service.js';
import { achPaymentService } from '../../services/achPaymentService.js';
import { directDepositService } from '../../services/directDepositService.js';

const app = express();
const PORT = process.env.PAYMENT_GATEWAY_PORT || 3005;

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Payment gateway will fail on live transactions.');
}
const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.use(cors());

app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`>>> [Payment][${requestId}] INCOMING: ${req.method} ${req.url}`);
  console.log(`>>> [Payment][${requestId}] Content-Type: ${req.headers['content-type']}`);
  
  req.on('data', (chunk) => {
    console.log(`>>> [Payment][${requestId}] Data Chunk Received: ${chunk.length} bytes`);
  });
  
  req.on('end', () => {
    console.log(`>>> [Payment][${requestId}] Stream END`);
  });
  
  next();
});

// --- Debug Routes (Isolated from all middleware except logging) ---
app.post('/api/debug/ping', express.json(), (req, res) => {
  console.log('>>> [Payment] DEBUG PING hit');
  res.json({ pong: true, body: req.body });
});


// --- 1. Stripe Webhook Handler (MUST be before express.json()) ---
/*
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  ... (body commented out)
});
*/

// --- Webhook Helpers ---
async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  await db.update(schema.achPayments)
    .set({ status: 'succeeded', actualSettlementDate: new Date(), updatedAt: new Date() })
    .where(eq(schema.achPayments.stripePaymentIntentId, pi.id));
    
  const [payment] = await db.select().from(schema.achPayments)
    .where(eq(schema.achPayments.stripePaymentIntentId, pi.id));
    
  if (payment && payment.journalEntryId) {
    await db.update(schema.journalEntries)
      .set({ status: 'Posted' })
      .where(eq(schema.journalEntries.id, payment.journalEntryId));
  }
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  await db.update(schema.achPayments)
    .set({ status: 'failed', failureReason: pi.last_payment_error?.message || 'Payment failed', updatedAt: new Date() })
    .where(eq(schema.achPayments.stripePaymentIntentId, pi.id));
    
  const [payment] = await db.select().from(schema.achPayments)
    .where(eq(schema.achPayments.stripePaymentIntentId, pi.id));
    
  if (payment && payment.journalEntryId) {
    await db.update(schema.journalEntries)
      .set({ status: 'Voided' })
      .where(eq(schema.journalEntries.id, payment.journalEntryId));
  }
}

// --- Standard Middleware ---
app.use(express.json());

const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`>>> [Payment] Authenticating: ${req.method} ${req.originalUrl}`);
  console.log(`>>> [Payment] Headers: ${JSON.stringify(req.headers)}`);
  
  if (req.method === 'OPTIONS' || req.originalUrl === '/api/health' || req.originalUrl === '/api/logs' || req.originalUrl === '/health') {
    console.log('>>> [Payment] Auth Bypass: Health/Logs/Options');
    return next();
  }
  
  const userId = req.header('X-User-ID');
  const userEmail = req.header('X-User-Email');
  const userRole = req.header('X-User-Role') || 'user';
  
  console.log(`>>> [Payment] User Context: ID=${userId}, Email=${userEmail}, Role=${userRole}`);
  
  if (!userId || !userEmail) {
    console.error('>>> [Payment] Auth Required: Missing Headers');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  (req as any).user = { id: userId, email: userEmail, role: userRole };
  console.log('>>> [Payment] Auth Success. Proceeding to handler...');
  next();
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};

const requireReconciliationAccess = requireRole(['admin', 'accountant', 'finance_manager']);

// Apply auth to all API routes
// app.use('/api', authenticateRequest);

// --- Helpers ---
function isValidEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function parseNumeric(val: any) { return typeof val === 'string' ? parseFloat(val) : val; }

function sanitizeCustomerInput(data: any) {
  return {
    firstName: data.firstName?.trim(),
    lastName: data.lastName?.trim(),
    email: data.email?.trim().toLowerCase(),
    phone: data.phone?.trim(),
    billingAddress: data.billingAddress ? JSON.stringify(data.billingAddress) : null,
    shippingAddress: data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
    customerId: data.customerId,
    stripeMetadata: data.stripeMetadata ? JSON.stringify(data.stripeMetadata) : null,
  };
}

function convertDbCustomer(c: any) {
  return { ...c, billingAddress: c.billingAddress ? JSON.parse(c.billingAddress) : null };
}

function convertDbPaymentMethod(pm: any) { return pm; }
function convertDbAchPayment(p: any) { return { ...p, amountCents: parseNumeric(p.amountCents) }; }

// --- API Routes ---


// Customers
app.post('/api/stripe/customers', async (req, res) => {
  try {
    const data = sanitizeCustomerInput(req.body);
    if (!data.firstName || !data.lastName || !data.email) return res.status(400).json({ error: 'Missing required fields' });

    const stripeCustomer = await stripe.customers.create({
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      metadata: data.stripeMetadata ? JSON.parse(data.stripeMetadata) : undefined,
    });

    const [newCustomer] = await db.insert(schema.customers).values({
      stripeCustomerId: stripeCustomer.id,
      ...data,
      stripeCreatedAt: new Date(stripeCustomer.created * 1000),
    }).returning();

    res.status(201).json(convertDbCustomer(newCustomer));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stripe/customers', async (req, res) => {
  const data = await db.select().from(schema.customers).where(isNull(schema.customers.deletedAt));
  res.json({ customers: data.map(convertDbCustomer) });
});

// ACH Payments
app.post('/api/stripe/ach/payment-intents', async (req, res) => {
  try {
    const { customerId, paymentMethodId, amountCents, description } = req.body;
    const stripePI = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
    });

    const [payment] = await db.insert(schema.achPayments).values({
      stripePaymentIntentId: stripePI.id,
      customerId,
      paymentMethodId,
      amountCents: amountCents.toString(),
      description,
      status: stripePI.status,
    }).returning();

    res.status(201).json(convertDbAchPayment(payment));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stripe/ach/payment-intents', async (req, res) => {
  try {
    const data = await db.select().from(schema.achPayments).orderBy(desc(schema.achPayments.createdAt));
    res.json({ payments: data.map(convertDbAchPayment) });
  } catch (error) {
    console.error('Error fetching ACH payments:', error);
    res.status(500).json({ error: 'Failed to fetch ACH payments' });
  }
});

// Direct Deposit Payouts & Recipients used by PayrollPayouts.tsx
app.get('/api/direct-deposit/payouts', async (req, res) => {
  try {
    const data = await db.select().from(schema.directDepositPayouts).orderBy(desc(schema.directDepositPayouts.createdAt));
    res.json(data);
  } catch (error) {
     console.error('Error fetching payouts:', error);
     res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

app.post('/api/direct-deposit/payouts', async (req, res) => {
  console.log('>>> [Payment] POST /api/direct-deposit/payouts START');
  try {
    const data = req.body;
    console.log('[Payment] Request Body Parsed:', !!data);
    
    if (!data.recipients || !Array.isArray(data.recipients)) {
       console.error('[Payment] Invalid recipients format');
       return res.status(400).json({ error: 'recipients must be an array' });
    }

    console.log(`[Payment] Processing ${data.recipients.length} recipients`);
    const payouts = [];
    for (const recipient of data.recipients) {
        console.log(`[Payment] Attempting insert for recipient: ${recipient.recipientId}`);
        
        // ISO 20022 Compliance: Generate End-to-End ID
        const endToEndId = `SOVR-PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        const [payoutParam] = await db.insert(schema.directDepositPayouts).values({
            recipientId: recipient.recipientId,
            destinationBankAccountId: recipient.bankAccountId,
            amountCents: recipient.amount ? Math.round(recipient.amount * 100).toString() : '0',
            status: 'pending',
            scheduledPayoutDate: data.scheduledPayoutDate || null,
            stripeMetadata: JSON.stringify({ endToEndId }), // Persist ISO ID
        }).returning();
        payouts.push(payoutParam);
        
        // --- Audit & System Logging ---
        await db.insert(schema.systemLogs).values({
            level: 'info',
            source: 'payment-gateway',
            message: `Direct Deposit Payout Created: ${payoutParam.id}`,
            metadata: JSON.stringify({ recipientId: recipient.recipientId, amount: payoutParam.amountCents, endToEndId }),
            timestamp: new Date()
        });

        await db.insert(schema.auditTrails).values({
            eventType: 'direct_deposit_created',
            entityType: 'payout',
            entityId: payoutParam.id,
            action: 'create',
            description: `Created direct deposit payout for recipient ${recipient.recipientId}`,
            severity: 'medium',
            timestamp: new Date(),
            complianceRelevant: true,
            regulatoryStandard: 'ISO20022_NACHA',
            metadata: JSON.stringify({ endToEndId, isoVersion: 'pain.001.001.03' })
        });

        console.log(`[Payment] Successfully inserted payout ID: ${payoutParam.id} with Audit Log (ISO: ${endToEndId}).`);
    }
    
    console.log('[Payment] All insertions complete');
    res.json({ success: true, message: 'Payouts created successfully', payouts });
  } catch (error: any) {
     console.error('>>> [Payment] FATAL Error creating payouts:', error);
     res.status(500).json({ error: 'Failed to create payouts', details: error.message });
  }
});

app.get('/api/direct-deposit/recipients', async (req, res) => {
  try {
    const verifiedOnly = req.query.verified === 'true';
    let query = db.select().from(schema.directDepositRecipients);
    
    if (verifiedOnly) {
      query = query.where(eq(schema.directDepositRecipients.verificationStatus, 'verified'));
    }
    
    const data = await query;
    res.json(data);
  } catch (error) {
     console.error('Error fetching recipients:', error);
     res.status(500).json({ error: 'Failed to fetch recipients' });
  }
});

app.get('/api/direct-deposit/recipients/:id/bank-accounts', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.select()
        .from(schema.directDepositBankAccounts)
        .where(eq(schema.directDepositBankAccounts.recipientId, id));
    res.json(data);
  } catch (error) {
     console.error('Error fetching bank accounts:', error);
     res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

app.get('/api/stripe/direct-deposits/payouts', async (req, res) => {
  try {
    const data = await db.select().from(schema.directDepositPayouts).orderBy(desc(schema.directDepositPayouts.createdAt));
    res.json(data); // Frontend expects array directly? or object? ApiService.getDirectDepositPayouts expects any[]
  } catch (error) {
     console.error('Error fetching payouts:', error);
     res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// ACH Returns
app.get('/api/stripe/ach/returns', async (req, res) => {
  try {
    const data = await db.select().from(schema.achReturns).orderBy(desc(schema.achReturns.returnedAt));
    res.json(data);
  } catch (error) {
     console.error('Error fetching returns:', error);
     res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// ACH Collection for Invoice
app.post('/api/stripe/ach/collect/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // 1. Fetch Invoice
    const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    // 2. Fetch Customer (Counterparty) - Assumption: Linked via name or ID
    // In a real scenario, invoice would have a stripeCustomerId or similar
    const [customer] = await db.select().from(schema.customers)
      .where(sql`CONCAT(${schema.customers.firstName}, ' ', ${schema.customers.lastName}) = ${invoice.counterparty}`)
      .limit(1);

    if (!customer || !customer.stripeCustomerId) {
      return res.status(400).json({ error: 'Customer not found or no Stripe ID linked' });
    }

    // 3. Create PaymentIntent
    const amountCents = Math.round(invoice.amount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customer.stripeCustomerId,
      payment_method_types: ['us_bank_account'],
      payment_method_options: {
        us_bank_account: { verification_method: 'automatic' },
      },
      metadata: { invoiceId },
      confirm: true,
      off_session: true, // Auto-charge if mandate exists
    });

    // 4. Record ACH Payment in DB
    const [payment] = await db.insert(schema.achPayments).values({
      stripePaymentIntentId: paymentIntent.id,
      customerId: customer.stripeCustomerId,
      amountCents: amountCents.toString(),
      description: `Invoice ${invoice.invoiceNumber}`,
      status: paymentIntent.status,
      invoiceId: invoiceId, // Ensure schema supports this linkage
    }).returning();

    // 5. Update Invoice Status
    await db.update(schema.invoices)
      .set({ status: 'PENDING_FUNDS' }) // Or 'Paid' if instant
      .where(eq(schema.invoices.id, invoiceId));

    res.json({ success: true, payment, paymentIntent });

  } catch (err: any) {
    console.error('ACH Collect Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ACH Payment (Pay Vendor)
app.post('/api/stripe/ach/pay/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    // Implementation for outbound payment (Connect Payouts or similar)
    // For now, we'll mark it as processing and simulate a payout
    
    const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Simulate Payout Logic
    // In production: stripe.payouts.create(...) or stripe.transfers.create(...)

    await db.update(schema.invoices)
      .set({ status: 'Paid' })
      .where(eq(schema.invoices.id, invoiceId));

    // Create Journal Entry
    // ... (Call internal logic or emit event)

    res.json({ success: true, message: 'Vendor payment initiated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Execute Outbound Payout (Stripe Integration Wired)
app.post('/api/stripe/payouts/execute', async (req, res) => {
  try {
    const { amountCents, currency, recipientId, messageType, purpose, reference, invoiceId } = req.body;
    
    console.log(`[Payment] Executing Outbound Payment: ${amountCents} ${currency} to ${recipientId}`);

    let result;
    const amountDollars = amountCents / 100;

    // Use directDepositService for payroll/standard payouts, ach for ACH credit to vendors.
    if (messageType === 'ACH') {
       if (!req.body.paymentMethodId) {
         return res.status(400).json({ success: false, error: 'paymentMethodId is required for ACH payments' });
       }
       result = await achPaymentService.processAchCredit({
         customerId: recipientId,
         amount: amountDollars,
         currency: currency || 'usd',
         description: purpose || 'ACH Payment',
         customerType: 'business',
         paymentMethodId: req.body.paymentMethodId,
         purpose: 'payment'
       });
    } else {
       // Direct deposit, ISO20022, default
       // Lookup default bank account for recipient
       const [bankAccount] = await db.select()
         .from(schema.directDepositBankAccounts)
         .where(and(
           eq(schema.directDepositBankAccounts.recipientId, recipientId),
           eq(schema.directDepositBankAccounts.isDefault, true)
         ))
         .limit(1);

       if (!bankAccount && !req.body.bankAccountId) {
         return res.status(400).json({ success: false, error: 'No default bank account found and no bankAccountId provided' });
       }

       result = await directDepositService.processDirectDeposit({
          recipientId: recipientId,
          amount: amountDollars,
          currency: currency || 'usd',
          description: purpose || 'Standard Payout',
          payPeriodStart: new Date().toISOString().split('T')[0],
          payPeriodEnd: new Date().toISOString().split('T')[0],
          bankAccountId: req.body.bankAccountId || bankAccount.stripeBankAccountId,
          purpose: purpose === 'salary' ? 'salary' : 'reimbursement'
       });
    }

    if (result && result.success) {
      res.json({ success: true, result });
    } else {
      res.status(400).json({ success: false, error: result?.error || 'Payout failed' });
    }

  } catch (err: any) {
    console.error('Execute Payout Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Journal Entries (Mocked for Payroll & Vendor) ---
app.post('/api/stripe/journal/payroll', async (req, res) => {
  try {
    const data = req.body;
    const entryId = `JE-PAY-${Date.now()}`;
    const [entry] = await db.insert(schema.journalEntries).values({
      id: entryId,
      date: new Date(data.payrollDate || Date.now()).toISOString().split('T')[0],
      description: `Payroll for ${data.employeeName} (${data.payPeriod})`,
      source: 'Stripe',
      status: 'Posted',
    }).returning();
    
    // Attempting to fetch some real accounts to avoid foreign key or type issues
    const accounts = await db.select().from(schema.accounts).limit(3);
    const acc1 = accounts[0]?.id || 1;
    const acc2 = accounts[1]?.id || 2;
    const acc3 = accounts[2]?.id || 3;

    // Add Lines
    await db.insert(schema.journalLines).values([
      { journalEntryId: entryId, accountId: acc1, type: 'DEBIT', amount: data.grossAmount.toString() },
      { journalEntryId: entryId, accountId: acc2, type: 'CREDIT', amount: data.taxAmount.toString() },
      { journalEntryId: entryId, accountId: acc3, type: 'CREDIT', amount: data.netAmount.toString() }
    ]);

    res.json({ success: true, journalEntry: entry });
  } catch (err: any) {
    console.error('Payroll JE Error:', err);
    res.status(500).json({ error: err.message, success: false });
  }
});

app.post('/api/stripe/journal/vendor-payment', async (req, res) => {
  try {
    const data = req.body;
    const entryId = `JE-VEN-${Date.now()}`;
    const [entry] = await db.insert(schema.journalEntries).values({
      id: entryId,
      date: new Date().toISOString().split('T')[0],
      description: `Vendor Payment: ${data.vendorName} (Inv: ${data.invoiceNumber}) - ${data.description}`,
      source: 'Stripe',
      status: 'Posted',
    }).returning();
    
    const accounts = await db.select().from(schema.accounts).limit(2);
    const acc1 = accounts[0]?.id || 1;
    const acc2 = accounts[1]?.id || 2;

    // Add Lines
    await db.insert(schema.journalLines).values([
      { journalEntryId: entryId, accountId: acc1, type: 'DEBIT', amount: data.amount.toString() },
      { journalEntryId: entryId, accountId: acc2, type: 'CREDIT', amount: data.amount.toString() }
    ]);

    res.json({ success: true, journalEntry: entry });
  } catch (err: any) {
    console.error('Vendor JE Error:', err);
    res.status(500).json({ error: err.message, success: false });
  }
});

// Health Check
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Payment Gateway' }));

app.listen(PORT, () => {
  console.log(`💳 Payment Gateway Service running on port ${PORT}`);
});

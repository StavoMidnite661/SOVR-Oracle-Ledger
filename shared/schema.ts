import { pgTable, serial, text, numeric, integer, timestamp, boolean, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const entityEnum = pgEnum('entity', ['LLC', 'Trust']);
export const accountTypeEnum = pgEnum('account_type', ['Asset', 'Liability', 'Equity', 'Income', 'Expense']);
export const lineTypeEnum = pgEnum('line_type', ['DEBIT', 'CREDIT']);
export const paymentMethodEnum = pgEnum('payment_method', ['ACH', 'Wire', 'Crypto']);
export const cardTypeEnum = pgEnum('card_type', ['Virtual', 'Physical', 'Fleet', 'Gas']);
export const cardProviderEnum = pgEnum('card_provider', ['Visa', 'Mastercard', 'Amex', 'Discover']);
export const spendCategoryEnum = pgEnum('spend_category', ['Fuel', 'Office', 'Travel', 'Software', 'Hardware', 'Other']);
export const vendorCategoryEnum = pgEnum('vendor_category', ['Software', 'Hardware', 'Services', 'Supplies', 'Professional', 'Other']);
export const statusEnum = pgEnum('status', ['Active', 'Inactive', 'Pending', 'Posted', 'Draft', 'Approved', 'Fulfilled', 'Paid', 'Issued', 'Overdue']);

// Chart of Accounts
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  entity: entityEnum('entity').notNull(),
  organizationId: integer('organization_id').references(() => organizations.id), // Nullable for legacy migration
  createdAt: timestamp('created_at').defaultNow(),
});

// Journal Entries
export const journalEntries = pgTable('journal_entries', {
  id: varchar('id', { length: 50 }).primaryKey(),
  date: varchar('date', { length: 10 }).notNull(),
  description: text('description').notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('Posted'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalLines = pgTable('journal_lines', {
  id: serial('id').primaryKey(),
  journalEntryId: varchar('journal_entry_id', { length: 50 }).notNull(),
  accountId: integer('account_id').notNull(),
  type: lineTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Employees
export const employees = pgTable('employees', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  annualSalary: numeric('annual_salary', { precision: 15, scale: 2 }).notNull(),
  bankRoutingNumber: varchar('bank_routing_number', { length: 9 }),
  bankAccountNumber: varchar('bank_account_number', { length: 20 }),
  paymentMethod: paymentMethodEnum('payment_method').default('ACH'),
  taxId: varchar('tax_id', { length: 11 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vendors
export const vendors = pgTable('vendors', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address').notNull(),
  paymentTerms: varchar('payment_terms', { length: 100 }).notNull(),
  bankAccountNumber: varchar('bank_account_number', { length: 20 }),
  bankRoutingNumber: varchar('bank_routing_number', { length: 9 }),
  taxId: varchar('tax_id', { length: 20 }).notNull(),
  status: statusEnum('status').notNull().default('Active'),
  category: vendorCategoryEnum('category').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Company Cards
export const companyCards = pgTable('company_cards', {
  id: varchar('id', { length: 50 }).primaryKey(),
  last4: varchar('last4', { length: 4 }).notNull(),
  providerTokenId: varchar('provider_token_id', { length: 255 }),
  cardType: cardTypeEnum('card_type').notNull(),
  cardProvider: cardProviderEnum('card_provider').notNull(),
  assignedTo: varchar('assigned_to', { length: 255 }),
  spendingLimitDaily: numeric('spending_limit_daily', { precision: 15, scale: 2 }),
  spendingLimitMonthly: numeric('spending_limit_monthly', { precision: 15, scale: 2 }),
  spendingLimitTransaction: numeric('spending_limit_transaction', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull().default('Active'),
  issueDate: varchar('issue_date', { length: 10 }).notNull(),
  expiryDate: varchar('expiry_date', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Card Transactions
export const cardTransactions = pgTable('card_transactions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  cardId: varchar('card_id', { length: 50 }).notNull(),
  merchantName: varchar('merchant_name', { length: 255 }).notNull(),
  merchantCategory: spendCategoryEnum('merchant_category').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  transactionDate: varchar('transaction_date', { length: 10 }).notNull(),
  postingDate: varchar('posting_date', { length: 10 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  location: varchar('location', { length: 255 }),
  accountingCode: varchar('accounting_code', { length: 20 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: varchar('id', { length: 50 }).primaryKey(),
  vendor: varchar('vendor', { length: 255 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: statusEnum('status').notNull().default('Draft'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  purchaseOrderId: varchar('purchase_order_id', { length: 50 }).notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoices
export const invoices = pgTable('invoices', {
  id: varchar('id', { length: 50 }).primaryKey(),
  type: varchar('type', { length: 2 }).notNull(), // 'AR' or 'AP'
  counterparty: varchar('counterparty', { length: 255 }).notNull(),
  issueDate: varchar('issue_date', { length: 10 }).notNull(),
  dueDate: varchar('due_date', { length: 10 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  status: statusEnum('status').notNull().default('Issued'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Consul Credits
export const consulCreditsTransactions = pgTable('consul_credits_transactions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  txHash: varchar('tx_hash', { length: 66 }).notNull(),
  blockNumber: integer('block_number').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  eventType: varchar('event_type', { length: 20 }).notNull(),
  userAddress: varchar('user_address', { length: 42 }).notNull(),
  tokenAddress: varchar('token_address', { length: 42 }).notNull(),
  tokenSymbol: varchar('token_symbol', { length: 10 }).notNull(),
  tokenAmount: varchar('token_amount', { length: 50 }).notNull(),
  consulCreditsAmount: varchar('consul_credits_amount', { length: 50 }).notNull(),
  exchangeRate: varchar('exchange_rate', { length: 50 }).notNull(),
  ledgerReference: varchar('ledger_reference', { length: 50 }),
  journalEntryId: varchar('journal_entry_id', { length: 50 }),
  confirmations: integer('confirmations').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const consulCreditsConfig = pgTable('consul_credits_config', {
  id: varchar('id', { length: 50 }).primaryKey().default('default'),
  contractAddress: varchar('contract_address', { length: 42 }).notNull(),
  networkName: varchar('network_name', { length: 100 }).notNull(),
  chainId: integer('chain_id').notNull(),
  rpcUrl: text('rpc_url').notNull(),
  oracleIntegratorAddress: varchar('oracle_integrator_address', { length: 42 }).notNull(),
  confirmationsRequired: integer('confirmations_required').notNull().default(3),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  level: varchar('level', { length: 20 }).notNull(), // 'info', 'warn', 'error', 'debug'
  source: varchar('source', { length: 50 }).notNull(), // 'frontend', 'gateway', 'blockchain', etc.
  message: text('message').notNull(),
  metadata: text('metadata'), // JSON stringified context
});

// Type exports for System Logs
export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;

// Card Reveal Audit
export const cardRevealAudit = pgTable('card_reveal_audit', {
  id: serial('id').primaryKey(),
  cardId: varchar('card_id', { length: 50 }).notNull(),
  revealedBy: varchar('revealed_by', { length: 255 }).notNull(),
  reason: text('reason').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Relations
export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalLines.accountId],
    references: [accounts.id],
  }),
}));

// export const accountsRelations = relations(accounts, ({ one }) => ({
//   organization: one(organizations, {
//     fields: [accounts.organizationId],
//     references: [organizations.id],
//   }),
// }));

// export const organizationsRelations = relations(organizations, ({ many }) => ({
//   accounts: many(accounts),
//   securities: many(securities),
// }));

// export const investorsRelations = relations(investors, ({ many }) => ({
//   shares: many(shareholders),
// }));

// export const securitiesRelations = relations(securities, ({ one, many }) => ({
//   organization: one(organizations, {
//     fields: [securities.organizationId],
//     references: [organizations.id],
//   }),
//   shareholders: many(shareholders),
// }));

// export const shareholdersRelations = relations(shareholders, ({ one }) => ({
//   investor: one(investors, {
//     fields: [shareholders.investorId],
//     references: [investors.id],
//   }),
//   security: one(securities, {
//     fields: [shareholders.securityId],
//     references: [securities.id],
//   }),
// }));

export const companyCardsRelations = relations(companyCards, ({ many }) => ({
  transactions: many(cardTransactions),
  revealAudits: many(cardRevealAudit),
}));

export const cardTransactionsRelations = relations(cardTransactions, ({ one }) => ({
  card: one(companyCards, {
    fields: [cardTransactions.cardId],
    references: [companyCards.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ many }) => ({
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
}));

export const cardRevealAuditRelations = relations(cardRevealAudit, ({ one }) => ({
  card: one(companyCards, {
    fields: [cardRevealAudit.cardId],
    references: [companyCards.id],
  }),
}));

// Types
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type JournalLine = typeof journalLines.$inferSelect;
export type NewJournalLine = typeof journalLines.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type CompanyCard = typeof companyCards.$inferSelect;
export type NewCompanyCard = typeof companyCards.$inferInsert;

export type CardTransaction = typeof cardTransactions.$inferSelect;
export type NewCardTransaction = typeof cardTransactions.$inferInsert;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type ConsulCreditsTransaction = typeof consulCreditsTransactions.$inferSelect;
export type NewConsulCreditsTransaction = typeof consulCreditsTransactions.$inferInsert;

export type ConsulCreditsConfig = typeof consulCreditsConfig.$inferSelect;
export type NewConsulCreditsConfig = typeof consulCreditsConfig.$inferInsert;

export type CardRevealAudit = typeof cardRevealAudit.$inferSelect;
export type NewCardRevealAudit = typeof cardRevealAudit.$inferInsert;

// ==============================
// STRIPE INTEGRATION TABLES
// ==============================

// Customer management for payment processing
export const customers = pgTable('customers', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique().notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 50 }),
  stripeDefaultPaymentMethodId: varchar('stripe_default_payment_method_id', { length: 255 }),
  billingAddress: text('billing_address'),
  shippingAddress: text('shipping_address'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  stripeCreatedAt: timestamp('stripe_created_at'),
  stripeUpdatedAt: timestamp('stripe_updated_at'),
  active: boolean('active').default(true),
  
  // ORACLE-LEDGER integration
  customerId: integer('customer_id'),
  
  // Compliance fields
  stripeMetadata: text('stripe_metadata'),
  deletedAt: timestamp('deleted_at'),
});

// Payment methods and bank accounts
export const paymentMethods = pgTable('payment_methods', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  customerId: varchar('customer_id', { length: 36 }).references(() => customers.id).notNull(),
  stripePaymentMethodId: varchar('stripe_payment_method_id', { length: 255 }).unique().notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'card', 'us_bank_account', 'sepa_debit'
  cardLast4: varchar('card_last4', { length: 4 }),
  cardBrand: varchar('card_brand', { length: 50 }),
  cardExpMonth: integer('card_exp_month'),
  cardExpYear: integer('card_exp_year'),
  bankName: varchar('bank_name', { length: 255 }),
  bankAccountLast4: varchar('bank_account_last4', { length: 4 }),
  bankAccountRoutingNumber: varchar('bank_account_routing_number', { length: 9 }),
  bankAccountType: varchar('bank_account_type', { length: 20 }), // 'checking', 'savings'
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'inactive', 'requires_verification'
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  verifiedAt: timestamp('verified_at'),
  verificationStatus: varchar('verification_status', { length: 50 }), // 'verified', 'pending', 'failed'
  
  // Stripe integration
  stripeMetadata: text('stripe_metadata'),
  setupIntentId: varchar('setup_intent_id', { length: 255 }),
  
  // Audit trail
  updatedBy: varchar('updated_by', { length: 36 }),
  deletedAt: timestamp('deleted_at'),
});

// ACH payment transactions
export const achPayments = pgTable('ach_payments', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }).unique(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  customerId: varchar('customer_id', { length: 36 }).references(() => customers.id).notNull(),
  paymentMethodId: varchar('payment_method_id', { length: 36 }).references(() => paymentMethods.id).notNull(),
  amountCents: varchar('amount_cents', { length: 20 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).default('USD'),
  description: text('description'),
  purpose: varchar('purpose', { length: 100 }), // 'payment', 'refund', 'fee'
  status: varchar('status', { length: 50 }).notNull(), // 'pending', 'succeeded', 'failed', 'canceled'
  paymentMethodType: varchar('payment_method_type', { length: 50 }).default('ach_debit'),
  
  // ACH specific fields
  achClassCode: varchar('ach_class_code', { length: 10 }).default('PPD'), // 'PPD', 'CCD', 'WEB', 'CBP'
  companyIdentification: varchar('company_identification', { length: 50 }),
  companyName: varchar('company_name', { length: 255 }),
  
  // Timing
  scheduledDate: varchar('scheduled_date', { length: 10 }),
  processedDate: timestamp('processed_date'),
  estimatedSettlementDate: varchar('estimated_settlement_date', { length: 10 }),
  actualSettlementDate: timestamp('actual_settlement_date'),
  
  // Return codes and errors
  returnCode: varchar('return_code', { length: 10 }),
  returnDescription: text('return_description'),
  failureReason: text('failure_reason'),
  
  // ORACLE-LEDGER integration
  invoiceId: varchar('invoice_id', { length: 36 }),
  journalEntryId: varchar('journal_entry_id', { length: 50 }).references(() => journalEntries.id),
  
  // Metadata
  stripeMetadata: text('stripe_metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ACH returns and reconciliation
export const achReturns = pgTable('ach_returns', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  achPaymentId: varchar('ach_payment_id', { length: 36 }).references(() => achPayments.id).notNull(),
  returnCode: varchar('return_code', { length: 10 }).notNull(), // R01, R02, etc.
  returnReason: varchar('return_reason', { length: 255 }),
  returnedAt: timestamp('returned_at').defaultNow(),
  corrected: boolean('corrected').default(false),
  correctionDate: timestamp('correction_date'),
  correctionMethod: varchar('correction_method', { length: 100 }),
  
  // Reconciliation fields
  adjustedAmountCents: varchar('adjusted_amount_cents', { length: 20 }),
  newPaymentDate: varchar('new_payment_date', { length: 10 }),
  notes: text('notes'),
  
  // ORACLE-LEDGER integration
  adjustmentJournalEntryId: varchar('adjustment_journal_entry_id', { length: 50 }).references(() => journalEntries.id),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Direct deposit recipients (employees/contractors)
export const directDepositRecipients = pgTable('direct_deposit_recipients', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }).unique().notNull(), // Stripe Connect account
  employeeId: varchar('employee_id', { length: 36 }).references(() => employees.id),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  dateOfBirth: varchar('date_of_birth', { length: 10 }),
  ssnLast4: varchar('ssn_last4', { length: 4 }),
  address: text('address'),
  
  // Verification status
  verificationStatus: varchar('verification_status', { length: 50 }).default('pending'), // 'pending', 'verified', 'failed'
  verificationRequired: boolean('verification_required').default(true),
  verificationDueDate: varchar('verification_due_date', { length: 10 }),
  
  // Stripe Connect details
  accountStatus: varchar('account_status', { length: 50 }).default('pending'),
  requiresVerification: boolean('requires_verification').default(true),
  verificationFieldsNeeded: text('verification_fields_needed'),
  verificationDisabledReason: varchar('verification_disabled_reason', { length: 255 }),
  
  // Compliance
  kycStatus: varchar('kyc_status', { length: 50 }), // 'pending', 'verified', 'failed'
  chargesEnabled: boolean('charges_enabled').default(false),
  transfersEnabled: boolean('transfers_enabled').default(false),
  payoutsEnabled: boolean('payouts_enabled').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  deletedAt: timestamp('deleted_at'),
});

// Bank accounts for direct deposit
export const directDepositBankAccounts = pgTable('direct_deposit_bank_accounts', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  recipientId: varchar('recipient_id', { length: 36 }).references(() => directDepositRecipients.id).notNull(),
  stripeBankAccountId: varchar('stripe_bank_account_id', { length: 255 }).unique().notNull(),
  accountHolderName: varchar('account_holder_name', { length: 255 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  routingNumber: varchar('routing_number', { length: 9 }).notNull(),
  accountNumberLast4: varchar('account_number_last4', { length: 4 }).notNull(),
  accountType: varchar('account_type', { length: 20 }).notNull(), // 'checking', 'savings'
  currency: varchar('currency', { length: 3 }).default('USD'),
  status: varchar('status', { length: 50 }).default('pending'),
  
  // Verification
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  defaultCurrency: varchar('default_currency', { length: 3 }),
  isDefault: boolean('is_default').default(false),
  
  // Stripe integration
  stripeMetadata: text('stripe_metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  deletedAt: timestamp('deleted_at'),
});

// Direct deposit transactions/payouts
export const directDepositPayouts = pgTable('direct_deposit_payouts', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  stripePayoutId: varchar('stripe_payout_id', { length: 255 }).unique(),
  recipientId: varchar('recipient_id', { length: 36 }).references(() => directDepositRecipients.id).notNull(),
  amountCents: varchar('amount_cents', { length: 20 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  description: text('description'),
  payPeriodStart: varchar('pay_period_start', { length: 10 }),
  payPeriodEnd: varchar('pay_period_end', { length: 10 }),
  
  // Payout timing
  scheduledPayoutDate: varchar('scheduled_payout_date', { length: 10 }),
  actualPayoutDate: timestamp('actual_payout_date'),
  estimatedArrivalDate: timestamp('estimated_arrival_date'),
  
  // Status tracking
  status: varchar('status', { length: 50 }).notNull(),
  failureReason: text('failure_reason'),
  
  // Bank account details
  destinationBankAccountId: varchar('destination_bank_account_id', { length: 36 }).references(() => directDepositBankAccounts.id),
  
  // ORACLE-LEDGER integration
  payrollRunId: varchar('payroll_run_id', { length: 36 }),
  journalEntryId: varchar('journal_entry_id', { length: 50 }).references(() => journalEntries.id),
  
  // Stripe metadata
  stripeMetadata: text('stripe_metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Webhook event logging
export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  stripeEventId: varchar('stripe_event_id', { length: 255 }).unique().notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  apiVersion: varchar('api_version', { length: 20 }),
  requestId: varchar('request_id', { length: 255 }),
  requestIdempotencyKey: varchar('request_idempotency_key', { length: 255 }),
  
  // Event data
  eventData: text('event_data').notNull(),
  livemode: boolean('livemode').default(false),
  pendingWebhooks: integer('pending_webhooks').default(0),
  
  // Processing status
  processedAt: timestamp('processed_at'),
  processingStatus: varchar('processing_status', { length: 50 }).default('pending'), // 'pending', 'processed', 'failed', 'duplicate'
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  
  // References to related records
  customerId: varchar('customer_id', { length: 36 }).references(() => customers.id),
  paymentMethodId: varchar('payment_method_id', { length: 36 }).references(() => paymentMethods.id),
  achPaymentId: varchar('ach_payment_id', { length: 36 }).references(() => achPayments.id),
  directDepositRecipientId: varchar('direct_deposit_recipient_id', { length: 36 }).references(() => directDepositRecipients.id),
  directDepositPayoutId: varchar('direct_deposit_payout_id', { length: 36 }).references(() => directDepositPayouts.id),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Payment reconciliation
export const paymentReconciliation = pgTable('payment_reconciliation', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  stripeBalanceTransactionId: varchar('stripe_balance_transaction_id', { length: 255 }).unique(),
  amountCents: varchar('amount_cents', { length: 20 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  netCents: varchar('net_cents', { length: 20 }).notNull(),
  feeCents: varchar('fee_cents', { length: 20 }).default('0'),
  type: varchar('type', { length: 50 }).notNull(), // 'charge', 'refund', 'adjustment', 'payout', 'payout_failure'
  
  // Related transactions
  achPaymentId: varchar('ach_payment_id', { length: 36 }).references(() => achPayments.id),
  directDepositPayoutId: varchar('direct_deposit_payout_id', { length: 36 }).references(() => directDepositPayouts.id),
  
  // Stripe details
  stripeCreated: timestamp('stripe_created'),
  stripeAvailableOn: timestamp('stripe_available_on'),
  stripeStatus: varchar('stripe_status', { length: 50 }),
  
  // ORACLE-LEDGER integration
  matchedJournalEntryId: varchar('matched_journal_entry_id', { length: 50 }).references(() => journalEntries.id),
  reconciledAt: timestamp('reconciled_at'),
  reconciledBy: varchar('reconciled_by', { length: 36 }),
  
  // Metadata
  description: text('description'),
  stripeMetadata: text('stripe_metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// PCI compliance audit log
export const pciAuditLog = pgTable('pci_audit_log', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  actionType: varchar('action_type', { length: 100 }).notNull(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 36 }),
  userEmail: varchar('user_email', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  sessionId: varchar('session_id', { length: 255 }),
  
  // PCI sensitive data handling
  sensitiveFieldsAccessed: text('sensitive_fields_accessed'), // JSON array
  dataMasked: boolean('data_masked').default(true),
  accessPurpose: text('access_purpose'),
  retentionPeriodDays: integer('retention_period_days'),
  
  // Audit details
  oldValues: text('old_values'),
  newValues: text('new_values'),
  additionalContext: text('additional_context'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Compliance verification checklist
export const complianceChecklist = pgTable('compliance_checklist', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  checklistType: varchar('checklist_type', { length: 100 }).notNull(),
  itemDescription: varchar('item_description', { length: 255 }).notNull(),
  requirement: varchar('requirement', { length: 500 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  assignedTo: varchar('assigned_to', { length: 36 }),
  dueDate: varchar('due_date', { length: 10 }),
  completionDate: varchar('completion_date', { length: 10 }),
  
  // Verification details
  verificationMethod: varchar('verification_method', { length: 100 }),
  verificationEvidence: text('verification_evidence'),
  verificationDate: timestamp('verification_date'),
  verifierUserId: varchar('verifier_user_id', { length: 36 }),
  
  // Compliance reference
  regulatoryStandard: varchar('regulatory_standard', { length: 100 }), // 'NACHA', 'PCI_DSS', 'AML', 'SOX'
  regulatorySection: varchar('regulatory_section', { length: 100 }),
  riskLevel: varchar('risk_level', { length: 20 }).default('medium'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Type exports for Stripe integration
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;

export type AchPayment = typeof achPayments.$inferSelect;
export type NewAchPayment = typeof achPayments.$inferInsert;

export type AchReturn = typeof achReturns.$inferSelect;
export type NewAchReturn = typeof achReturns.$inferInsert;

export type DirectDepositRecipient = typeof directDepositRecipients.$inferSelect;
export type NewDirectDepositRecipient = typeof directDepositRecipients.$inferInsert;

export type DirectDepositBankAccount = typeof directDepositBankAccounts.$inferSelect;
export type NewDirectDepositBankAccount = typeof directDepositBankAccounts.$inferInsert;

export type DirectDepositPayout = typeof directDepositPayouts.$inferSelect;
export type NewDirectDepositPayout = typeof directDepositPayouts.$inferInsert;

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type NewStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;

export type PaymentReconciliationEntry = typeof paymentReconciliation.$inferSelect;
export type NewPaymentReconciliationEntry = typeof paymentReconciliation.$inferInsert;

export type PciAuditLogEntry = typeof pciAuditLog.$inferSelect;
export type NewPciAuditLogEntry = typeof pciAuditLog.$inferInsert;

export type ComplianceChecklistItem = typeof complianceChecklist.$inferSelect;
export type NewComplianceChecklistItem = typeof complianceChecklist.$inferInsert;

// ==============================
// STRIPE ACCOUNT MAPPING TABLES
// ==============================

// Stripe account mappings for payment processing
export const stripeAccountMappings = pgTable('stripe_account_mappings', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  stripeAccountType: varchar('stripe_account_type', { length: 100 }).unique().notNull(),
  accountId: integer('account_id').references(() => accounts.id).notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Stripe payment reconciliation table
export const stripePaymentReconciliation = pgTable('stripe_payment_reconciliation', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  stripeBalanceTransactionId: varchar('stripe_balance_transaction_id', { length: 255 }).unique(),
  amountCents: varchar('amount_cents', { length: 20 }).notNull(),
  feeCents: varchar('fee_cents', { length: 20 }).default('0'),
  netCents: varchar('net_cents', { length: 20 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(),
  stripeCreated: timestamp('stripe_created'),
  availableOn: timestamp('available_on'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  accountId: integer('account_id').references(() => accounts.id).notNull(),
  journalEntryId: varchar('journal_entry_id', { length: 50 }).references(() => journalEntries.id),
  reconciledAt: timestamp('reconciled_at'),
  reconciledBy: varchar('reconciled_by', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ACH processing log table
export const achProcessingLog = pgTable('ach_processing_log', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  achPaymentId: varchar('ach_payment_id', { length: 36 }),
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
  processingFeeCents: varchar('processing_fee_cents', { length: 20 }).notNull(),
  processingDate: timestamp('processing_date').defaultNow(),
  accountId: integer('account_id').references(() => accounts.id).notNull(),
  journalEntryId: varchar('journal_entry_id', { length: 50 }).references(() => journalEntries.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports for Stripe account mapping
export type StripeAccountMapping = typeof stripeAccountMappings.$inferSelect;
export type NewStripeAccountMapping = typeof stripeAccountMappings.$inferInsert;

export type StripePaymentReconciliationEntry = typeof stripePaymentReconciliation.$inferSelect;
export type NewStripePaymentReconciliationEntry = typeof stripePaymentReconciliation.$inferInsert;

export type AchProcessingLogEntry = typeof achProcessingLog.$inferSelect;
export type NewAchProcessingLogEntry = typeof achProcessingLog.$inferInsert;

// ==============================
// COMPLIANCE DASHBOARD TABLES
// ==============================

// Compliance health scoring system
export const complianceHealthScores = pgTable('compliance_health_scores', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  overallScore: numeric('overall_score', { precision: 5, scale: 2 }).notNull(),
  dataProtectionScore: numeric('data_protection_score', { precision: 5, scale: 2 }),
  financialControlsScore: numeric('financial_controls_score', { precision: 5, scale: 2 }),
  operationalScore: numeric('operational_score', { precision: 5, scale: 2 }),
  securityScore: numeric('security_score', { precision: 5, scale: 2 }),
  calculatedDate: timestamp('calculated_date').defaultNow(),
  calculationPeriod: varchar('calculation_period', { length: 20 }).default('monthly'), // daily, weekly, monthly, quarterly
  trendDirection: varchar('trend_direction', { length: 20 }), // improving, stable, declining
  previousScore: numeric('previous_score', { precision: 5, scale: 2 }),
  factors: text('factors'), // JSON string with breakdown of score factors
  recommendations: text('recommendations'), // JSON string with recommendations
  status: varchar('status', { length: 20 }).default('active'), // active, archived
  calculatedBy: varchar('calculated_by', { length: 36 }),
});

export const complianceStandards = pgTable('compliance_standards', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).unique().notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // Data Protection, Security, Financial Controls, etc.
  jurisdiction: varchar('jurisdiction', { length: 100 }), // EU, US, UK, Global, etc.
  effectiveDate: varchar('effective_date', { length: 10 }),
  expiryDate: varchar('expiry_date', { length: 10 }),
  status: varchar('status', { length: 20 }).default('active'), // active, deprecated, under_review
  requirements: text('requirements'), // JSON string with detailed requirements
  scoringMethodology: text('scoring_methodology'), // JSON string with scoring logic
  lastAssessmentDate: timestamp('last_assessment_date'),
  nextAssessmentDate: timestamp('next_assessment_date'),
  complianceLevel: numeric('compliance_level', { precision: 5, scale: 2 }),
  evidenceRequired: boolean('evidence_required').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Regulatory requirement tracking
export const regulatoryRequirements = pgTable('regulatory_requirements', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  standardId: varchar('standard_id', { length: 36 }).references(() => complianceStandards.id),
  code: varchar('code', { length: 100 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  jurisdiction: varchar('jurisdiction', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'), // critical, high, medium, low
  status: varchar('status', { length: 20 }).default('active'), // active, pending, deprecated, under_review
  effectiveDate: varchar('effective_date', { length: 10 }).notNull(),
  lastUpdated: varchar('last_updated', { length: 10 }).notNull(),
  nextReviewDate: varchar('next_review_date', { length: 10 }),
  complianceLevel: numeric('compliance_level', { precision: 5, scale: 2 }),
  requirements: text('requirements'), // JSON string with sub-requirements
  documentation: text('documentation'), // JSON string with required documentation
  tags: text('tags'), // JSON string array
  relatedRequirements: text('related_requirements'), // JSON string array of requirement IDs
  authority: varchar('authority', { length: 255 }), // Regulatory body
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const regulatoryChanges = pgTable('regulatory_changes', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  requirementId: varchar('requirement_id', { length: 36 }).references(() => regulatoryRequirements.id),
  changeType: varchar('change_type', { length: 50 }).notNull(), // New, Amendment, Repeal, Clarification
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  impactLevel: varchar('impact_level', { length: 20 }).default('medium'), // critical, high, medium, low
  affectedRequirements: text('affected_requirements'), // JSON string array of requirement IDs
  announcementDate: varchar('announcement_date', { length: 10 }).notNull(),
  effectiveDate: varchar('effective_date', { length: 10 }),
  complianceDeadline: varchar('compliance_deadline', { length: 10 }),
  status: varchar('status', { length: 20 }).default('published'), // proposed, published, implemented, reviewed
  impactAssessment: text('impact_assessment'), // JSON string with detailed impact analysis
  actionRequired: text('action_required'), // JSON string array of required actions
  relatedDocuments: text('related_documents'), // JSON string array of document URLs
  source: varchar('source', { length: 255 }),
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const complianceGaps = pgTable('compliance_gaps', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  requirementId: varchar('requirement_id', { length: 36 }).references(() => regulatoryRequirements.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 20 }).default('medium'), // critical, high, medium, low
  status: varchar('status', { length: 20 }).default('open'), // open, in_progress, resolved, accepted
  identifiedDate: varchar('identified_date', { length: 10 }).notNull(),
  targetResolutionDate: varchar('target_resolution_date', { length: 10 }),
  actualResolutionDate: varchar('actual_resolution_date', { length: 10 }),
  assignedTo: varchar('assigned_to', { length: 36 }),
  remediationSteps: text('remediation_steps'), // JSON string array
  evidence: text('evidence'), // JSON string array of evidence references
  riskLevel: numeric('risk_level', { precision: 5, scale: 2 }),
  businessImpact: text('business_impact'),
  dependencies: text('dependencies'), // JSON string array
  relatedGaps: text('related_gaps'), // JSON string array of gap IDs
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Policy management and versioning
export const compliancePolicies = pgTable('compliance_policies', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // Data Protection, Security, Financial Controls, etc.
  status: varchar('status', { length: 20 }).default('draft'), // draft, under_review, approved, active, suspended, archived
  version: varchar('version', { length: 50 }).notNull(),
  type: varchar('type', { length: 50 }).default('policy'), // policy, procedure, guideline, standard, code_of_conduct
  priority: varchar('priority', { length: 20 }).default('medium'), // critical, high, medium, low
  owner: varchar('owner', { length: 255 }).notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  effectiveDate: varchar('effective_date', { length: 10 }).notNull(),
  expiryDate: varchar('expiry_date', { length: 10 }),
  lastReviewDate: varchar('last_review_date', { length: 10 }),
  nextReviewDate: varchar('next_review_date', { length: 10 }),
  approvalWorkflow: text('approval_workflow'), // JSON string with approval steps
  content: text('content'), // JSON string with policy content
  requirements: text('requirements'), // JSON string with requirement mappings
  stakeholders: text('stakeholders'), // JSON string array of stakeholder information
  attachments: text('attachments'), // JSON string array of file references
  tags: text('tags'), // JSON string array
  relatedPolicies: text('related_policies'), // JSON string array of policy IDs
  complianceMetrics: text('compliance_metrics'), // JSON string with compliance metrics
  keywords: text('keywords'), // JSON string array
  language: varchar('language', { length: 10 }).default('en'),
  confidentialityLevel: varchar('confidentiality_level', { length: 20 }).default('internal'), // public, internal, confidential, restricted
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const policyVersions = pgTable('policy_versions', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  policyId: varchar('policy_id', { length: 36 }).references(() => compliancePolicies.id).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  changeDate: varchar('change_date', { length: 10 }).notNull(),
  changedBy: varchar('changed_by', { length: 36 }).notNull(),
  changeType: varchar('change_type', { length: 50 }).notNull(), // creation, minor_update, major_update, reformat, review_update
  changeDescription: text('change_description'),
  reason: varchar('reason', { length: 500 }),
  approvalStatus: varchar('approval_status', { length: 20 }).default('pending'), // pending, approved, rejected
  approvedBy: varchar('approved_by', { length: 36 }),
  approvedDate: varchar('approved_date', { length: 10 }),
  changes: text('changes'), // JSON string array with detailed changes
  reviewCycle: varchar('review_cycle', { length: 50 }),
  content: text('content'), // Full content for this version
  createdAt: timestamp('created_at').defaultNow(),
});

export const policyAuditTrail = pgTable('policy_audit_trail', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  policyId: varchar('policy_id', { length: 36 }).references(() => compliancePolicies.id).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // created, updated, reviewed, approved, published, archived, suspended
  performedBy: varchar('performed_by', { length: 36 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  details: text('details'),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Training management and completion tracking
export const trainingPrograms = pgTable('training_programs', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // Data Protection, Security, Financial Controls, etc.
  type: varchar('type', { length: 50 }).default('onboarding'), // onboarding, annual, role_specific, regulatory, policy_update, incident_response
  priority: varchar('priority', { length: 20 }).default('medium'), // critical, high, medium, low
  status: varchar('status', { length: 20 }).default('draft'), // draft, active, paused, archived
  version: varchar('version', { length: 50 }).notNull(),
  effectiveDate: varchar('effective_date', { length: 10 }).notNull(),
  expiryDate: varchar('expiry_date', { length: 10 }),
  duration: integer('duration'), // in minutes
  difficulty: varchar('difficulty', { length: 20 }).default('beginner'), // beginner, intermediate, advanced, expert
  format: varchar('format', { length: 50 }).default('online'), // online, instructor_led, hybrid, self_paced, assessment_only
  language: varchar('language', { length: 10 }).default('en'),
  estimatedCost: numeric('estimated_cost', { precision: 15, scale: 2 }),
  prerequisites: text('prerequisites'), // JSON string array
  objectives: text('objectives'), // JSON string array
  targetAudience: text('target_audience'), // JSON string with audience targeting
  course: text('course'), // JSON string with course content
  assessment: text('assessment'), // JSON string with assessment details
  requirements: text('requirements'), // JSON string with requirement mappings
  analytics: text('analytics'), // JSON string with training analytics
  metadata: text('metadata'), // JSON string with additional metadata
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastUpdated: timestamp('last_updated').defaultNow(),
  nextReviewDate: varchar('next_review_date', { length: 10 }),
});

export const trainingEnrollments = pgTable('training_enrollments', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  userId: varchar('user_id', { length: 36 }).notNull(),
  programId: varchar('program_id', { length: 36 }).references(() => trainingPrograms.id).notNull(),
  enrollmentDate: varchar('enrollment_date', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).default('enrolled'), // enrolled, in_progress, completed, failed, expired, withdrawn
  progress: text('progress'), // JSON string with detailed progress information
  assessmentResults: text('assessment_results'), // JSON string with assessment scores
  certificate: text('certificate'), // JSON string with certificate information
  completionDate: varchar('completion_date', { length: 10 }),
  dueDate: varchar('due_date', { length: 10 }),
  assignedBy: varchar('assigned_by', { length: 36 }),
  priority: varchar('priority', { length: 20 }).default('medium'), // critical, high, medium, low
  tags: text('tags'), // JSON string array
  notes: text('notes'),
  lastActivity: timestamp('last_activity').defaultNow(),
  timeSpent: integer('time_spent'), // in minutes
  attempts: integer('attempts').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const trainingCertificates = pgTable('training_certificates', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  programId: varchar('program_id', { length: 36 }).references(() => trainingPrograms.id).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  issuedDate: varchar('issued_date', { length: 10 }).notNull(),
  expiryDate: varchar('expiry_date', { length: 10 }),
  certificateNumber: varchar('certificate_number', { length: 100 }).unique(),
  verificationCode: varchar('verification_code', { length: 100 }).unique(),
  template: varchar('template', { length: 255 }),
  metadata: text('metadata'), // JSON string with certificate metadata
  digitalSignature: text('digital_signature'), // JSON string with signature information
  createdAt: timestamp('created_at').defaultNow(),
});

export const trainingSchedules = pgTable('training_schedules', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  programId: varchar('program_id', { length: 36 }).references(() => trainingPrograms.id).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  type: varchar('type', { length: 50 }), // instructor_led, virtual_classroom, webinar, workshop
  startDate: varchar('start_date', { length: 10 }).notNull(),
  endDate: varchar('end_date', { length: 10 }).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  location: text('location'), // JSON string with location details
  instructor: varchar('instructor', { length: 255 }).notNull(),
  capacity: integer('capacity'),
  enrolledCount: integer('enrolled_count').default(0),
  waitlistCount: integer('waitlist_count').default(0),
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, confirmed, in_progress, completed, cancelled
  prerequisites: text('prerequisites'), // JSON string array
  materials: text('materials'), // JSON string array
  registrationDeadline: varchar('registration_deadline', { length: 10 }),
  cancellationPolicy: text('cancellation_policy'),
  reminderSettings: text('reminder_settings'), // JSON string with reminder configuration
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Risk assessment and mitigation tracking
export const riskAssessments = pgTable('risk_assessments', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // Operational, Financial, Strategic, Compliance, Technology
  subcategory: varchar('subcategory', { length: 100 }),
  likelihood: integer('likelihood').notNull(), // 1-5 scale
  impact: integer('impact').notNull(), // 1-5 scale
  riskScore: integer('risk_score').notNull(), // likelihood * impact
  inherentRisk: integer('inherent_risk'), // risk before controls
  residualRisk: integer('residual_risk'), // risk after controls
  status: varchar('status', { length: 20 }).default('identified'), // identified, assessed, mitigated, accepted, closed
  owner: varchar('owner', { length: 36 }),
  department: varchar('department', { length: 255 }),
  identifiedDate: varchar('identified_date', { length: 10 }).notNull(),
  assessmentDate: varchar('assessment_date', { length: 10 }),
  nextReviewDate: varchar('next_review_date', { length: 10 }),
  businessUnits: text('business_units'), // JSON string array
  stakeholders: text('stakeholders'), // JSON string array
  riskFactors: text('risk_factors'), // JSON string array
  controls: text('controls'), // JSON string array of existing controls
  mitigationPlan: text('mitigation_plan'), // JSON string with mitigation strategy
  monitoring: text('monitoring'), // JSON string with monitoring plan
  escalation: text('escalation'), // JSON string with escalation procedures
  evidence: text('evidence'), // JSON string array of evidence references
  relatedRisks: text('related_risks'), // JSON string array of related risk IDs
  tags: text('tags'), // JSON string array
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const riskMitigationActions = pgTable('risk_mitigation_actions', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  riskId: varchar('risk_id', { length: 36 }).references(() => riskAssessments.id).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  actionType: varchar('action_type', { length: 50 }), // preventive, detective, corrective, directive
  priority: varchar('priority', { length: 20 }).default('medium'), // critical, high, medium, low
  status: varchar('status', { length: 20 }).default('planned'), // planned, in_progress, completed, cancelled, deferred
  assignedTo: varchar('assigned_to', { length: 36 }),
  dueDate: varchar('due_date', { length: 10 }),
  completedDate: varchar('completed_date', { length: 10 }),
  effort: varchar('effort', { length: 100 }), // low, medium, high
  cost: numeric('cost', { precision: 15, scale: 2 }),
  effectiveness: varchar('effectiveness', { length: 20 }), // high, medium, low, unknown
  progress: numeric('progress', { precision: 5, scale: 2 }), // 0-100 percentage
  dependencies: text('dependencies'), // JSON string array
  resources: text('resources'), // JSON string array
  deliverables: text('deliverables'), // JSON string array
  validation: text('validation'), // JSON string with validation criteria
  evidence: text('evidence'), // JSON string array of evidence references
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit preparation and evidence storage
export const auditTrails = pgTable('audit_trails', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // policy, training, risk, compliance, etc.
  entityId: varchar('entity_id', { length: 36 }),
  userId: varchar('user_id', { length: 36 }),
  userEmail: varchar('user_email', { length: 255 }),
  userRole: varchar('user_role', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Event details
  action: varchar('action', { length: 100 }).notNull(), // create, update, delete, approve, reject, etc.
  description: text('description'),
  oldValues: text('old_values'), // JSON string
  newValues: text('new_values'), // JSON string
  
  // Context
  context: text('context'), // JSON string with additional context
  metadata: text('metadata'), // JSON string with arbitrary metadata
  tags: text('tags'), // JSON string array
  
  // Compliance specific
  complianceRelevant: boolean('compliance_relevant').default(false),
  regulatoryStandard: varchar('regulatory_standard', { length: 100 }),
  evidenceType: varchar('evidence_type', { length: 100 }),
  retentionPeriod: integer('retention_period'), // in days
  
  // Audit trail
  timestamp: timestamp('timestamp').defaultNow(),
  severity: varchar('severity', { length: 20 }).default('info'), // critical, high, medium, low, info
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const auditEvidence = pgTable('audit_evidence', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  evidenceType: varchar('evidence_type', { length: 100 }).notNull(), // document, record, screenshot, log, configuration, etc.
  filePath: varchar('file_path', { length: 500 }),
  fileHash: varchar('file_hash', { length: 128 }), // SHA256 hash for integrity
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Relationships
  auditTrailId: varchar('audit_trail_id', { length: 36 }).references(() => auditTrails.id),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: varchar('entity_id', { length: 36 }),
  
  // Compliance
  complianceRelevant: boolean('compliance_relevant').default(false),
  regulatoryStandard: varchar('regulatory_standard', { length: 100 }),
  requirementReference: varchar('requirement_reference', { length: 255 }),
  retentionPeriod: integer('retention_period'), // in days
  expiryDate: varchar('expiry_date', { length: 10 }),
  
  // Verification
  verified: boolean('verified').default(false),
  verifiedBy: varchar('verified_by', { length: 36 }),
  verificationDate: timestamp('verification_date'),
  verificationMethod: varchar('verification_method', { length: 100 }),
  verificationNotes: text('verification_notes'),
  
  // Access control
  confidentialityLevel: varchar('confidentiality_level', { length: 20 }).default('internal'), // public, internal, confidential, restricted
  accessRestrictions: text('access_restrictions'), // JSON string array
  
  // Metadata
  source: varchar('source', { length: 255 }),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  tags: text('tags'), // JSON string array
  metadata: text('metadata'), // JSON string with additional metadata
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const complianceReports = pgTable('compliance_reports', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('operational'), // executive_dashboard, operational, regulatory, audit, custom, trend_analysis
  status: varchar('status', { length: 20 }).default('draft'), // draft, active, scheduled, archived
  
  // Report configuration
  template: text('template'), // JSON string with report template
  parameters: text('parameters'), // JSON string with report parameters
  filters: text('filters'), // JSON string with data filters
  
  // Data
  data: text('data'), // JSON string with report data
  generatedDate: timestamp('generated_date').defaultNow(),
  period: varchar('period', { length: 100 }), // e.g., "2024-Q4"
  startDate: varchar('start_date', { length: 10 }),
  endDate: varchar('end_date', { length: 10 }),
  
  // Scheduling
  schedule: text('schedule'), // JSON string with scheduling information
  recipients: text('recipients'), // JSON string array of recipients
  
  // Metadata
  version: varchar('version', { length: 50 }).default('1.0.0'),
  confidentiality: varchar('confidentiality', { length: 20 }).default('internal'), // public, internal, confidential, restricted
  retentionPeriod: integer('retention_period'), // in days
  tags: text('tags'), // JSON string array
  dataSources: text('data_sources'), // JSON string array of data sources
  
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastGenerated: timestamp('last_generated'),
  generationCount: integer('generation_count').default(0),
});

export const complianceAlerts = pgTable('compliance_alerts', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // compliance, risk, deadline, incident, regulatory
  severity: varchar('severity', { length: 20 }).default('medium'), // critical, high, medium, low
  
  // Status
  status: varchar('status', { length: 20 }).default('open'), // open, acknowledged, resolved, dismissed
  
  // Relationships
  entityType: varchar('entity_type', { length: 100 }), // policy, training, risk, requirement, etc.
  entityId: varchar('entity_id', { length: 36 }),
  relatedAlerts: text('related_alerts'), // JSON string array of related alert IDs
  
  // Trigger information
  triggerCondition: text('trigger_condition'), // JSON string with trigger details
  threshold: text('threshold'), // JSON string with threshold information
  
  // Timeline
  triggeredDate: timestamp('triggered_date').defaultNow(),
  acknowledgedDate: timestamp('acknowledged_date'),
  acknowledgedBy: varchar('acknowledged_by', { length: 36 }),
  resolvedDate: timestamp('resolved_date'),
  resolvedBy: varchar('resolved_by', { length: 36 }),
  
  // Assignment
  assignedTo: varchar('assigned_to', { length: 36 }),
  priority: varchar('priority', { length: 20 }).default('medium'), // critical, high, medium, low
  dueDate: varchar('due_date', { length: 10 }),
  
  // Actions and resolution
  actionsTaken: text('actions_taken'), // JSON string array
  resolution: text('resolution'),
  
  // Metadata
  tags: text('tags'), // JSON string array
  metadata: text('metadata'), // JSON string with additional metadata
  source: varchar('source', { length: 255 }), // system or user that created the alert
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations for compliance tables
export const complianceHealthScoresRelations = relations(complianceHealthScores, ({ many }) => ({
  // Add relations as needed
}));

export const complianceStandardsRelations = relations(complianceStandards, ({ many }) => ({
  requirements: many(regulatoryRequirements),
}));

export const regulatoryRequirementsRelations = relations(regulatoryRequirements, ({ one, many }) => ({
  standard: one(complianceStandards, {
    fields: [regulatoryRequirements.standardId],
    references: [complianceStandards.id],
  }),
  changes: many(regulatoryChanges),
  gaps: many(complianceGaps),
}));

export const regulatoryChangesRelations = relations(regulatoryChanges, ({ one }) => ({
  requirement: one(regulatoryRequirements, {
    fields: [regulatoryChanges.requirementId],
    references: [regulatoryRequirements.id],
  }),
}));

export const complianceGapsRelations = relations(complianceGaps, ({ one }) => ({
  requirement: one(regulatoryRequirements, {
    fields: [complianceGaps.requirementId],
    references: [regulatoryRequirements.id],
  }),
}));

export const compliancePoliciesRelations = relations(compliancePolicies, ({ many }) => ({
  versions: many(policyVersions),
  auditTrail: many(policyAuditTrail),
}));

export const policyVersionsRelations = relations(policyVersions, ({ one }) => ({
  policy: one(compliancePolicies, {
    fields: [policyVersions.policyId],
    references: [compliancePolicies.id],
  }),
}));

export const policyAuditTrailRelations = relations(policyAuditTrail, ({ one }) => ({
  policy: one(compliancePolicies, {
    fields: [policyAuditTrail.policyId],
    references: [compliancePolicies.id],
  }),
}));

export const trainingProgramsRelations = relations(trainingPrograms, ({ many }) => ({
  enrollments: many(trainingEnrollments),
  certificates: many(trainingCertificates),
  schedules: many(trainingSchedules),
}));

export const trainingEnrollmentsRelations = relations(trainingEnrollments, ({ one }) => ({
  program: one(trainingPrograms, {
    fields: [trainingEnrollments.programId],
    references: [trainingPrograms.id],
  }),
}));

export const trainingCertificatesRelations = relations(trainingCertificates, ({ one }) => ({
  program: one(trainingPrograms, {
    fields: [trainingCertificates.programId],
    references: [trainingPrograms.id],
  }),
}));

export const trainingSchedulesRelations = relations(trainingSchedules, ({ one }) => ({
  program: one(trainingPrograms, {
    fields: [trainingSchedules.programId],
    references: [trainingPrograms.id],
  }),
}));

export const riskAssessmentsRelations = relations(riskAssessments, ({ many }) => ({
  mitigationActions: many(riskMitigationActions),
}));

export const riskMitigationActionsRelations = relations(riskMitigationActions, ({ one }) => ({
  risk: one(riskAssessments, {
    fields: [riskMitigationActions.riskId],
    references: [riskAssessments.id],
  }),
}));

export const auditTrailsRelations = relations(auditTrails, ({ many }) => ({
  evidence: many(auditEvidence),
}));

export const auditEvidenceRelations = relations(auditEvidence, ({ one }) => ({
  auditTrail: one(auditTrails, {
    fields: [auditEvidence.auditTrailId],
    references: [auditTrails.id],
  }),
}));

// Type exports for compliance features
export type ComplianceHealthScore = typeof complianceHealthScores.$inferSelect;
export type NewComplianceHealthScore = typeof complianceHealthScores.$inferInsert;

export type ComplianceStandard = typeof complianceStandards.$inferSelect;
export type NewComplianceStandard = typeof complianceStandards.$inferInsert;

export type RegulatoryRequirement = typeof regulatoryRequirements.$inferSelect;
export type NewRegulatoryRequirement = typeof regulatoryRequirements.$inferInsert;

export type RegulatoryChange = typeof regulatoryChanges.$inferSelect;
export type NewRegulatoryChange = typeof regulatoryChanges.$inferInsert;

export type ComplianceGap = typeof complianceGaps.$inferSelect;
export type NewComplianceGap = typeof complianceGaps.$inferInsert;

export type CompliancePolicy = typeof compliancePolicies.$inferSelect;
export type NewCompliancePolicy = typeof compliancePolicies.$inferInsert;

export type PolicyVersion = typeof policyVersions.$inferSelect;
export type NewPolicyVersion = typeof policyVersions.$inferInsert;

export type PolicyAuditTrail = typeof policyAuditTrail.$inferSelect;
export type NewPolicyAuditTrail = typeof policyAuditTrail.$inferInsert;

export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type NewTrainingProgram = typeof trainingPrograms.$inferInsert;

export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;
export type NewTrainingEnrollment = typeof trainingEnrollments.$inferInsert;

export type TrainingCertificate = typeof trainingCertificates.$inferSelect;
export type NewTrainingCertificate = typeof trainingCertificates.$inferInsert;

export type TrainingSchedule = typeof trainingSchedules.$inferSelect;
export type NewTrainingSchedule = typeof trainingSchedules.$inferInsert;

export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type NewRiskAssessment = typeof riskAssessments.$inferInsert;

export type RiskMitigationAction = typeof riskMitigationActions.$inferSelect;
export type NewRiskMitigationAction = typeof riskMitigationActions.$inferInsert;

export type AuditTrail = typeof auditTrails.$inferSelect;
export type NewAuditTrail = typeof auditTrails.$inferInsert;

export type AuditEvidence = typeof auditEvidence.$inferSelect;
export type NewAuditEvidence = typeof auditEvidence.$inferInsert;

export type ComplianceReport = typeof complianceReports.$inferSelect;
export type NewComplianceReport = typeof complianceReports.$inferInsert;

export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type NewComplianceAlert = typeof complianceAlerts.$inferInsert;

// ==============================
// MULTI-TENANT & COMPLIANCE TABLES
// ==============================

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  taxId: varchar('tax_id', { length: 20 }), // EIN
  type: varchar('type', { length: 50 }).notNull(), // LLC, Trust, SPV
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const investors = pgTable('investors', {
  id: varchar('id', { length: 36 }).primaryKey().$default(() => sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  accreditedStatus: boolean('accredited_status').default(false).notNull(),
  kycStatus: varchar('kyc_status', { length: 50 }).default('Pending').notNull(),
  taxId: varchar('tax_id', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const securities = pgTable('securities', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  ticker: varchar('ticker', { length: 10 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  assetType: varchar('asset_type', { length: 50 }).notNull(), // Equity, Tokenized, Debt, Real Estate
  totalSupply: numeric('total_supply', { precision: 20, scale: 6 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shareholders = pgTable('shareholders', {
  id: serial('id').primaryKey(),
  investorId: varchar('investor_id', { length: 36 }).references(() => investors.id).notNull(),
  securityId: integer('security_id').references(() => securities.id).notNull(),
  sharesOwned: numeric('shares_owned', { precision: 20, scale: 6 }).notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types for new tables
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Investor = typeof investors.$inferSelect;
export type NewInvestor = typeof investors.$inferInsert;

export type Security = typeof securities.$inferSelect;
export type NewSecurity = typeof securities.$inferInsert;

export type Shareholder = typeof shareholders.$inferSelect;
export type NewShareholder = typeof shareholders.$inferInsert;

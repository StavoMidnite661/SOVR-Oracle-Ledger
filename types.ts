
export enum AccountType {
  Asset = 'Asset',
  Liability = 'Liability',
  Equity = 'Equity',
  Income = 'Income',
  Expense = 'Expense',
}

export enum Entity {
  LLC = 'SOVR Development Holdings LLC',
  Trust = 'GM Family Trust',
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  entity: Entity;
}

export interface JournalEntryLine {
  accountId: number;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: JournalEntryLine[];
  source: 'CHAIN' | 'NACHA' | 'PO' | 'AR' | 'AP' | 'PURCHASE' | 'PAYROLL' | 'INTERCOMPANY' | 'PAYMENT';
  status: 'Posted' | 'Pending' | 'Approved' | 'Voided';
  vendorId?: string;
  txHash?: string;
  blockNumber?: number;
  chainConfirmations?: number;
  
  // === AUDIT & COMPLIANCE FIELDS (NEW) ===
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  referenceDocument?: string;           // Invoice #, Receipt, Contract, etc.
  memo?: string;                        // Additional notes per entry
  reversalOf?: string;                  // ID of the original entry this reverses
  attachmentUrl?: string;               // Link to supporting document
  taxCode?: string;                     // For 1099 / tax reporting
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  date: string;
  items: { description: string; amount: number }[];
  totalAmount: number;
  status: 'Draft' | 'Approved' | 'Fulfilled' | 'Paid';
}

export interface Invoice {
  id: string;
  type: 'AR' | 'AP';
  counterparty: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'Issued' | 'Paid' | 'Overdue';
}

export interface Employee {
    id: string;
    name: string;
    annualSalary: number;
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    paymentMethod?: 'ACH' | 'Wire' | 'Crypto';
    taxId?: string;
    
    // === NEW COMPLIANCE FIELDS ===
    status?: 'Active' | 'Terminated' | 'On Leave' | 'Suspended';
    payFrequency?: 'Weekly' | 'Bi-Weekly' | 'Semi-Monthly' | 'Monthly';
    federalWithholding?: number;        // Percentage or fixed amount
    stateWithholding?: number;
    localWithholding?: number;
    ytdGross?: number;
    ytdNet?: number;
    ytdDeductions?: number;
    employmentStartDate?: string;
    employmentEndDate?: string;
    taxFormStatus?: 'W4_Received' | 'W9_Received' | 'Pending';
    deductions?: Array<{ type: string; amount: number }>; // 401k, health, etc.
}

export interface PayrollRun {
    id: string;
    date: string;
    totalGross: number;
    totalNet: number;
    employeeCount: number;
}

export interface Vendor {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    paymentTerms: string;
    bankAccountNumber?: string;
    bankRoutingNumber?: string;
    taxId: string;
    status: 'Active' | 'Inactive';
    category: 'Software' | 'Hardware' | 'Services' | 'Supplies' | 'Professional' | 'Other';
    notes?: string;
    createdDate: string;
    
    // === NEW COMPLIANCE FIELDS ===
    taxClassification?: 'Individual' | 'C-Corp' | 'S-Corp' | 'LLC' | 'Partnership' | 'Trust';
    w9Status?: 'Received' | 'Pending' | 'Expired';
    w9ReceivedDate?: string;
    riskRating?: 'Low' | 'Medium' | 'High';
    paymentTermsDays?: number;
    creditLimit?: number;
    bankingVerified?: boolean;
    lastVerificationDate?: string;
}

export interface CardNumber {
  last4: string; // Last 4 digits for display
  providerTokenId?: string; // Token reference for secure retrieval
}

export interface CompanyCard {
  id: string;
  cardNumber: CardNumber; // Secure card number storage
  cardType: 'Virtual' | 'Physical' | 'Fleet' | 'Gas';
  cardProvider: 'Visa' | 'Mastercard' | 'Amex' | 'Discover';
  assignedTo?: string; // Employee ID or name
  assignedEntity: Entity;
  status: 'Active' | 'Suspended' | 'Expired' | 'Cancelled';
  monthlyLimit: number;
  dailyLimit: number;
  transactionLimit: number;
  spentThisMonth: number;
  spentThisQuarter: number;
  spentThisYear: number;
  allowedCategories: SpendCategory[];
  blockedCategories: SpendCategory[];
  expirationDate: string;
  issueDate: string;
  lastActivity?: string;
  billingAddress: string;
  notes?: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  merchantName: string;
  merchantCategory: SpendCategory;
  amount: number;
  currency: 'USD';
  transactionDate: string;
  postingDate: string;
  description: string;
  status: 'Posted' | 'Pending' | 'Declined';
  receiptUrl?: string;
  location?: string;
  accountingCode?: string;
  journalEntryId?: string;
  approvedBy?: string;
  notes?: string;
  
  // === NEW: Expense Tracking & Audit Fields ===
  policyViolation?: boolean;
  policyViolationReason?: string;
  reimbursementStatus?: 'Not Submitted' | 'Pending' | 'Approved' | 'Reimbursed';
  submittedBy?: string;
  approvedAt?: string;
  receiptFileName?: string;
}

export interface SpendingRule {
  id: string;
  cardId: string;
  ruleType: 'Daily Limit' | 'Monthly Limit' | 'Category Block' | 'Merchant Block' | 'Geographic Restriction';
  value: string | number;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
}

export enum SpendCategory {
  Office = 'Office Supplies',
  Travel = 'Travel & Lodging',
  Meals = 'Meals & Entertainment',
  Software = 'Software & Subscriptions',
  Marketing = 'Marketing & Advertising',
  Fuel = 'Fuel & Fleet',
  Maintenance = 'Maintenance & Repairs',
  Professional = 'Professional Services',
  Equipment = 'Equipment & Hardware',
  Utilities = 'Utilities',
  Training = 'Training & Education',
  Insurance = 'Insurance',
  Other = 'Other Expenses',
}

export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountType: 'Checking' | 'Savings';
    isActive: boolean;
}

export enum View {
  Dashboard = 'DASHBOARD',
  Journal = 'JOURNAL',
  ChartOfAccounts = 'CHART_OF_ACCOUNTS',
  PurchaseOrders = 'PURCHASE_ORDERS',
  AccountsReceivable = 'ACCOUNTS_RECEIVABLE',
  AccountsPayable = 'ACCOUNTS_PAYABLE',
  VendorPayments = 'VENDOR_PAYMENTS',
  VendorManagement = 'VENDOR_MANAGEMENT',
  CardManagement = 'CARD_MANAGEMENT',
  ConsulCredits = 'CONSUL_CREDITS',
  Payroll = 'PAYROLL',
  StripePayments = 'STRIPE_PAYMENTS',
  StripeSettings = 'STRIPE_SETTINGS',
  StripeCompliance = 'STRIPE_COMPLIANCE',
  StripeReports = 'STRIPE_REPORTS',
  ISO20022 = 'ISO20022',
  Settings = 'SETTINGS',
}

// Security and Audit Types
export enum UserRole {
  Admin = 'Admin',
  Finance = 'Finance',
  Auditor = 'Auditor',
  Viewer = 'Viewer',
}

export enum RegulatoryStandard {
  NACHA = 'NACHA',
  PCI_DSS = 'PCI_DSS',
  AML = 'AML',
  SOX = 'SOX',
  BANKING_REGULATIONS = 'BANKING_REGULATIONS',
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string; // User ID or name
  action: 'CARD_NUMBER_REVEALED' | 'CARD_CREATED' | 'CARD_SUSPENDED' | 'CARD_ACTIVATED' | 'SETTINGS_CHANGED' | 'BLOCKCHAIN_EVENT';
  targetId: string; // Card ID, Transaction ID, etc.
  reason?: string;
  result: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface CardRevealRequest {
  cardId: string;
  reason: string;
  authCode?: string; // MFA code
}

export interface CardRevealResponse {
  fullNumber: string;
  expiresAt: string; // ISO timestamp when reveal expires
  auditId: string;
}

// Blockchain and Smart Contract Types
export interface ChainSettings {
  rpcUrl: string;
  contractAddress: string;
  chainId: number;
  confirmations: number;
  lastProcessedBlock: number;
  isEnabled: boolean;
}

export interface BlockchainEvent {
  id: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  eventType: 'LEDGER_POSTED' | 'TOKEN_TRANSFER' | 'TOKEN_MINT' | 'TOKEN_BURN' | 'TOKEN_DEPOSITED' | 'TOKEN_WITHDRAWN';
  contractAddress: string;
  chainId: number;
  confirmations: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  eventData: Record<string, any>;
  journalEntryId?: string;
  processedAt?: string;
  createdAt: string;
}

export interface SmartContractMapping {
  eventType: string;
  accountMapping: Record<string, number>; // Map event params to account IDs
  description: string;
  enabled: boolean;
}

// Consul Credits Wrapper Contract Types
export type ConsulCreditsTab = 'overview' | 'tokens' | 'transactions' | 'settings';

export interface ConsulCreditsConfig {
  contractAddress: string;
  networkName: string;
  chainId: number;
  rpcUrl: string;
  oracleIntegratorAddress: string;
  confirmationsRequired: number;
  isEnabled: boolean;
}

export interface SupportedToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  exchangeRate: string; // Consul credits per token (as string to preserve precision)
  isActive: boolean;
  totalDeposited: string;
  totalWithdrawn: string;
  userWalletBalance?: string; // User's personal wallet balance
}

export interface ConsulCreditsTransaction {
  id: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  eventType: 'DEPOSIT' | 'WITHDRAW' | 'ORACLE_MINT' | 'ORACLE_BURN';
  userAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenAmount: string;
  consulCreditsAmount: string;
  exchangeRate: string;
  ledgerReference: string;
  journalEntryId?: string;
  confirmations: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export interface ConsulCreditsBalance {
  userAddress: string;
  totalConsulCredits: string;
  tokenBalances: Array<{
    tokenAddress: string;
    tokenSymbol: string;
    deposited: string;
    withdrawn: string;
    netBalance: string;
  }>;
  lastUpdated: string;
}

export interface ConsulCreditsStats {
  totalSupply: string;
  totalUniqueHolders: number;
  totalTransactions: number;
  supportedTokensCount: number;
  totalValueLockedUSD?: string;
  activeUsers?: number;
  contractReserves: Array<{
    tokenAddress: string;
    tokenSymbol: string;
    balance: string;
    value: string; // In consul credits
  }>;
}

// ==============================
// APPLICATION SETTINGS TYPES
// ==============================

export interface AppSettings {
  general: {
    appName: string;
    organizationName: string;
    timezone: string;
    dateFormat: string;
  };
  connectivity: {
    rpcUrl: string;
    contractAddress: string;
    apiEndpoint: string;
    websocketEndpoint: string;
  };
  security: {
    mfaEnabled: boolean;
    sessionTimeout: number; // minutes
    auditLevel: 'Minimal' | 'Standard' | 'Full';
    pciComplianceMode: boolean;
  };
  appearance: {
    theme: 'Dark' | 'Glass' | 'Minimal';
    accentColor: string;
    sidebarCompact: boolean;
  };
}

// ==============================
// STRIPE ACCOUNT MAPPING TYPES
// ==============================

export interface StripeAccountMapping {
  id: string;
  stripeAccountType: string;
  accountId: number;
  accountName: string;
  accountType: AccountType;
  entity: Entity;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StripePaymentAccountValidation {
  isValid: boolean;
  errors: string[];
  requiredAccounts: {
    achSettlementAccount: number;
    stripeClearingAccount: number;
    achProcessingFeesAccount: number;
    stripeProcessingFeesAccount: number;
    directDepositLiabilitiesAccount: number;
    bankChargesExpenseAccount: number;
    paymentCardFeesAccount: number;
  };
}

export interface StripeAccountBalance {
  accountId: number;
  accountName: string;
  balance: number;
  lastUpdated: Date;
  currency: string;
}

export interface StripeReconciliationEntry {
  id: string;
  stripeTransactionId: string;
  accountId: number;
  amount: number;
  feeAmount: number;
  netAmount: number;
  transactionDate: Date;
  status: 'pending' | 'reconciled' | 'discrepancy';
  journalEntryId?: string;
  notes?: string;
}

// ==============================
// STRIPE INTEGRATION TYPES
// ==============================

export interface StripeCustomer {
  id: string;
  stripeCustomerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stripeDefaultPaymentMethodId?: string;
  billingAddress?: string; // JSON string
  shippingAddress?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
  stripeCreatedAt?: Date;
  stripeUpdatedAt?: Date;
  active: boolean;
  customerId?: number; // Reference to ORACLE-LEDGER customer
  stripeMetadata?: string; // JSON string
  deletedAt?: Date;
}

export interface StripePaymentMethod {
  id: string;
  customerId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'us_bank_account' | 'sepa_debit';
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  bankName?: string;
  bankAccountLast4?: string;
  bankAccountRoutingNumber?: string;
  bankAccountType?: 'checking' | 'savings';
  status: 'active' | 'inactive' | 'requires_verification';
  isDefault: boolean;
  createdAt: Date;
  verifiedAt?: Date;
  verificationStatus?: 'verified' | 'pending' | 'failed';
  stripeMetadata?: string; // JSON string
  setupIntentId?: string;
  updatedBy?: string;
  deletedAt?: Date;
}

export interface AchPayment {
  id: string;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
  customerId: string;
  paymentMethodId: string;
  amountCents: number; // Stored as string in DB, convert to number
  currencyCode: string;
  description?: string;
  purpose?: 'payment' | 'refund' | 'fee';
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  paymentMethodType: string;
  
  // ACH specific fields
  achClassCode: 'PPD' | 'CCD' | 'WEB' | 'CBP'; // Standard ACH class codes
  companyIdentification?: string;
  companyName?: string;
  
  // Timing
  scheduledDate?: string;
  processedDate?: Date;
  estimatedSettlementDate?: string;
  actualSettlementDate?: Date;
  
  // Return codes and errors
  returnCode?: string; // R01, R02, etc.
  returnDescription?: string;
  failureReason?: string;
  
  // ORACLE-LEDGER integration
  invoiceId?: string;
  journalEntryId?: string;
  
  stripeMetadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface AchReturn {
  id: string;
  achPaymentId: string;
  returnCode: string; // R01, R02, etc.
  returnReason?: string;
  returnedAt: Date;
  corrected: boolean;
  correctionDate?: Date;
  correctionMethod?: string;
  
  // Reconciliation fields
  adjustedAmountCents?: number;
  newPaymentDate?: string;
  notes?: string;
  
  // ORACLE-LEDGER integration
  adjustmentJournalEntryId?: string;
  
  createdAt: Date;
}

export interface DirectDepositRecipient {
  id: string;
  stripeAccountId: string; // Stripe Connect account ID
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  ssnLast4?: string;
  address?: string; // JSON string
  
  // Verification status
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationRequired: boolean;
  verificationDueDate?: string;
  
  // Stripe Connect details
  accountStatus: string;
  requiresVerification: boolean;
  verificationFieldsNeeded?: string; // JSON string
  verificationDisabledReason?: string;
  
  // Compliance
  kycStatus?: 'pending' | 'verified' | 'failed';
  chargesEnabled: boolean;
  transfersEnabled: boolean;
  payoutsEnabled: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface DirectDepositBankAccount {
  id: string;
  recipientId: string;
  stripeBankAccountId: string;
  accountHolderName: string;
  bankName: string;
  routingNumber: string;
  accountNumberLast4: string;
  accountType: 'checking' | 'savings';
  currency: string;
  status: 'pending' | 'verified' | 'verification_failed' | 'deleted';
  
  // Verification
  isVerified: boolean;
  verifiedAt?: Date;
  defaultCurrency?: string;
  isDefault: boolean;
  
  // Stripe integration
  stripeMetadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface DirectDepositPayout {
  id: string;
  stripePayoutId?: string;
  recipientId: string;
  amountCents: number;
  currency: string;
  description?: string;
  payPeriodStart?: string;
  payPeriodEnd?: string;
  
  // Payout timing
  scheduledPayoutDate?: string;
  actualPayoutDate?: Date;
  estimatedArrivalDate?: Date;
  
  // Status tracking
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled' | 'return' | 'risk_reversed';
  failureReason?: string;
  
  // Bank account details
  destinationBankAccountId?: string;
  
  // ORACLE-LEDGER integration
  payrollRunId?: string;
  journalEntryId?: string;
  
  // Stripe metadata
  stripeMetadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface StripeWebhookEvent {
  id: string;
  stripeEventId: string;
  eventType: string;
  apiVersion?: string;
  requestId?: string;
  requestIdempotencyKey?: string;
  
  // Event data
  eventData: string; // JSON string
  livemode: boolean;
  pendingWebhooks: number;
  
  // Processing status
  processedAt?: Date;
  processingStatus: 'pending' | 'processed' | 'failed' | 'duplicate';
  errorMessage?: string;
  retryCount: number;
  
  // References to related records
  customerId?: string;
  paymentMethodId?: string;
  achPaymentId?: string;
  directDepositRecipientId?: string;
  directDepositPayoutId?: string;
  
  createdAt: Date;
}

export interface PaymentReconciliationEntry {
  id: string;
  stripeBalanceTransactionId?: string;
  amountCents: number;
  currency: string;
  netCents: number;
  feeCents: number;
  type: 'charge' | 'refund' | 'adjustment' | 'payout' | 'payout_failure';
  
  // Related transactions
  achPaymentId?: string;
  directDepositPayoutId?: string;
  
  // Stripe details
  stripeCreated?: Date;
  stripeAvailableOn?: Date;
  stripeStatus?: string;
  
  // ORACLE-LEDGER integration
  matchedJournalEntryId?: string;
  reconciledAt?: Date;
  reconciledBy?: string;
  
  // Metadata
  description?: string;
  stripeMetadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface PciAuditLogEntry {
  id: string;
  actionType: string;
  tableName: string;
  recordId: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // PCI sensitive data handling
  sensitiveFieldsAccessed?: string; // JSON array
  dataMasked: boolean;
  accessPurpose?: string;
  retentionPeriodDays?: number;
  
  // Audit details
  oldValues?: string; // JSON string
  newValues?: string; // JSON string
  additionalContext?: string; // JSON string
  
  createdAt: Date;
}

export interface ComplianceChecklistItem {
  id: string;
  checklistType: string;
  itemDescription: string;
  requirement: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'exempt';
  assignedTo?: string;
  dueDate?: string;
  completionDate?: string;
  
  // Verification details
  verificationMethod?: string;
  verificationEvidence?: string;
  verificationDate?: Date;
  verifierUserId?: string;
  
  // Compliance reference
  regulatoryStandard?: 'NACHA' | 'PCI_DSS' | 'AML' | 'SOX';
  regulatorySection?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ACH Return Codes for reference
export enum AchReturnCodes {
  R01 = 'Insufficient Funds',
  R02 = 'Account Closed',
  R03 = 'No Account / Unable to Locate Account',
  R04 = 'Invalid Account Number',
  R05 = 'Unauthorized Debit',
  R07 = 'Authorization Revoked',
  R08 = 'Payment Stopped',
  R09 = 'Uncollected Funds',
  R10 = 'Advices Not Delivered',
  R11 = 'Check Item',
  R12 = 'Branch Sold to Another RDFI',
  R13 = 'Invalid ACH Routing Number',
  R14 = 'Representive Payee Deceased',
  R15 = 'Beneficiary Deceased',
  R16 = 'Account Frozen',
  R17 = 'File Record Edit Criteria',
  R18 = 'Improper Effective Date',
  R19 = 'Amount of File Record Field Errors',
  R20 = 'Non-Payment Bank Account',
  R21 = 'Invalid Company ID',
  R22 = 'Invalid Individual ID Number',
  R23 = 'Credit Entry Refused by Receiver',
  R24 = 'Duplicate Entry',
  R25 = 'Addenda Error',
  R26 = 'Mandatory Field Error',
  R27 = 'Trace Number Error',
  R28 = 'Routing Number Check Digit Error',
  R29 = 'Corporate Customer Advises Not Authorized',
  R30 = 'Not Used',
  R31 = 'Permissible Return Entry',
  R32 = 'Bank Does Not Participate in ACH',
  R33 = 'Return of XCK Entry',
  R34 = 'Limited Participation RDFI',
  R35 = 'Return of Improper Debit Entry',
  R36 = 'Return of Improper Credit Entry',
  R37 = 'Source Document Presented for Payment',
  R38 = 'Stop Payment on Source Document',
  R39 = 'Improper Use of Source Document',
  R40 = 'Return of Return Items',
  R41 = 'Invalid Transaction Code',
  R42 = 'Routing Number or Account Number Format Error',
  R43 = 'Permissible Return Entry Not Accepted',
  R44 = 'Invalid FD Account Number',
  R45 = 'Invalid Individual ID Number',
  R46 = 'Invalid Individual Name',
  R47 = 'Duplicate Enrollments',
  R48 = 'Reserved',
  R49 = 'Reserved',
  R50 = 'State Law Affecting RCK Acceptance',
  R51 = 'Item Related to RCK Entry',
  R52 = 'Stop Payment on Item Related to RCK',
  R53 = 'Item and RCK Entry Presented for Payment',
  R54 = 'Reserved',
  R55 = 'Reserved',
  R56 = 'Return of XCK Entry',
  R57 = 'Return of XCK Entry',
  R58 = 'Return of XCK Entry',
  R59 = 'Return of XCK Entry',
  R60 = 'Return of XCK Entry',
  R61 = 'Return of XCK Entry',
  R62 = 'Return of XCK Entry',
  R63 = 'Return of XCK Entry',
  R64 = 'Return of XCK Entry',
  R65 = 'Return of XCK Entry',
  R66 = 'Return of XCK Entry',
  R67 = 'Return of XCK Entry',
  R68 = 'Return of XCK Entry',
  R69 = 'Return of XCK Entry',
  R70 = 'Return of XCK Entry',
  R71 = 'Truncated Debit Entry Returned',
  R72 = 'Truncated Return Entry Not Accepted',
  R73 = 'Reserved',
  R74 = 'Non-Customer 3rd Party',
  R75 = 'Return of XCK Entry',
  R76 = 'Return of XCK Entry',
  R77 = 'Corrected Return',
  R78 = 'Return of XCK Entry',
  R79 = 'Return of XCK Entry',
  R80 = 'Corrupt Return Record',
  R81 = 'Reserved',
  R82 = 'Reserved',
  R83 = 'Reserved',
  R84 = 'Reserved',
  R85 = 'Reserved'
}

// ==============================
// FEE TRACKING TYPES
// ==============================

export interface FeeCalculation {
  id: string;
  transactionId: string;
  transactionType: 'ach_payment' | 'card_charge' | 'direct_deposit_payout';
  
  // Fee amounts in cents
  processingFeeCents: number;
  achFeeCents: number;
  stripeFeeCents: number;
  bankFeeCents: number;
  verificationFeeCents: number;
  payoutFeeCents: number;
  totalFeeCents: number;
  effectiveRate: number; // As percentage (e.g., 2.9 for 2.9%)
  
  // Fee calculation parameters
  paymentType: 'ACH_DEBIT' | 'ACH_CREDIT' | 'CARD' | 'DIRECT_DEPOSIT';
  customerType?: 'business' | 'consumer';
  volumeTier?: 'low' | 'medium' | 'high' | 'enterprise';
  riskLevel?: 'low' | 'medium' | 'high';
  processingLocation?: 'domestic' | 'international';
  cardType?: 'debit' | 'credit' | 'prepaid';
  
  // Volume and discount information
  originalAmountCents: number;
  volumeDiscountCents: number;
  
  // Calculated fields
  calculatedAt: Date;
  calculatedBy: string;
  
  // Validation and compliance
  calculationMethod: string;
  validationStatus: 'pending' | 'validated' | 'flagged' | 'error';
  validationErrors?: string;
  complianceChecked: boolean;
  
  // Stripe integration
  stripeFeeDetails?: string; // JSON string
  stripeBalanceTransactionId?: string;
  
  // Metadata
  calculationMetadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeAllocation {
  id: string;
  feeCalculationId: string;
  
  // Account allocation
  accountId: number;
  accountName: string;
  
  // Fee allocation details
  feeType: string;
  allocatedAmountCents: number;
  description: string;
  source: 'NACHA' | 'Stripe' | 'Bank' | 'Payroll' | 'Compliance';
  
  // Journal entry linkage
  journalEntryId?: string;
  journalLineId?: number;
  
  // Allocation metadata
  allocationMethod: 'direct' | 'proportional' | 'fixed';
  allocationPercentage?: number;
  
  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Metadata
  allocationMetadata?: string; // JSON string
}

export interface FeeRule {
  id: string;
  ruleName: string;
  ruleType: 'ACH_PRICING' | 'CARD_PRICING' | 'VOLUME_DISCOUNT' | 'RISK_ADJUSTMENT';
  
  // Rule parameters
  paymentType: string;
  customerType?: string;
  volumeTier?: string;
  riskLevel?: string;
  processingLocation?: string;
  
  // Fee calculation parameters
  baseRateCents: number;
  percentageRate: number; // As decimal (e.g., 0.029 for 2.9%)
  flatFeeCents: number;
  capAmountCents?: number;
  
  // Adjustment factors
  volumeDiscountPercent: number;
  riskAdjustmentPercent: number;
  locationAdjustmentPercent: number;
  
  // Rule validity
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  
  // Compliance and audit
  regulatoryReference?: string;
  complianceNotes?: string;
  
  // Metadata
  ruleMetadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface FeeReport {
  id: string;
  reportType: 'monthly' | 'quarterly' | 'annual' | 'custom';
  reportPeriodStart: string;
  reportPeriodEnd: string;
  reportMonth: number;
  reportYear: number;
  
  // Volume and totals
  totalTransactionVolumeCents: number;
  totalTransactionCount: number;
  totalFeesCents: number;
  totalVolumeDiscountsCents: number;
  
  // Fees by type
  achDebitFeesCents: number;
  achCreditFeesCents: number;
  cardProcessingFeesCents: number;
  directDepositFeesCents: number;
  verificationFeesCents: number;
  
  // Fees by category
  processingFeesCents: number;
  bankFeesCents: number;
  stripeFeesCents: number;
  complianceFeesCents: number;
  
  // Metrics
  averageFeePerTransactionCents: number;
  averageEffectiveRate: number;
  costPerTransactionCents: number;
  
  // Optimization metrics
  volumeDiscountsEarnedCents: number;
  potentialSavingsCents: number;
  optimizationOpportunities: number;
  
  // Comparison with previous period
  previousPeriodVolumeCents?: number;
  previousPeriodFeesCents?: number;
  volumeGrowthPercent?: number;
  feeGrowthPercent?: number;
  
  // Report metadata
  generatedAt: Date;
  generatedBy: string;
  reportData?: string; // JSON string
  exportFormats?: string[];
  
  createdAt: Date;
}

export interface FeeOptimizationRecommendation {
  id: string;
  recommendationType: 'ACH_ROUTING' | 'VOLUME_DISCOUNT' | 'RATE_NEGOTIATION' | 'PROCESSING_OPTIMIZATION';
  title: string;
  description: string;
  
  // Financial impact
  potentialMonthlySavingsCents: number;
  potentialAnnualSavingsCents: number;
  implementationCostCents: number;
  roiRatio?: number;
  
  // Priority and timing
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  
  // Implementation requirements
  requirements: string[];
  dependencies?: string[];
  implementationSteps?: string[];
  
  // Status tracking
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented';
  reviewedBy?: string;
  reviewedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  implementedBy?: string;
  implementedAt?: Date;
  
  // Results (for implemented recommendations)
  actualMonthlySavingsCents?: number;
  actualAnnualSavingsCents?: number;
  actualRoiRatio?: number;
  notes?: string;
  
  // Metadata
  recommendationMetadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeComplianceRecord {
  id: string;
  feeCalculationId: string;
  
  // Compliance information
  regulatoryStandard: 'NACHA' | 'PCI_DSS' | 'AML' | 'SOX' | 'BANKING_REGULATIONS';
  complianceRequirement: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_review' | 'exempt';
  
  // Audit trail
  calculatedBy: string;
  calculatedAt: Date;
  validatedBy?: string;
  validatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  
  // Compliance details
  calculationMethod: string;
  validationCriteria?: string;
  complianceNotes?: string;
  exceptions?: string[];
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors?: string; // JSON string
  
  // Documentation
  supportingDocumentation?: string[];
  complianceEvidence?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeVarianceAlert {
  id: string;
  alertType: 'threshold_exceeded' | 'unusual_pattern' | 'compliance_risk' | 'cost_increase';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Alert details
  message: string;
  currentValue: number;
  expectedValue: number;
  varianceAmount: number;
  variancePercent?: number;
  
  // Related data
  feeCalculationId?: string;
  feeReportId?: string;
  transactionType?: string;
  
  // Time period
  periodStart?: Date;
  periodEnd?: Date;
  alertTimestamp: Date;
  
  // Status and resolution
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  
  // Metadata
  alertMetadata?: string; // JSON string
  createdAt: Date;
}

export interface FeeDispute {
  id: string;
  feeCalculationId: string;
  
  // Dispute details
  disputeType: 'duplicate_charge' | 'incorrect_calculation' | 'unauthorized_fee' | 'processing_error';
  status: 'open' | 'under_review' | 'escalated' | 'resolved' | 'closed';
  
  // Financial details
  disputedAmountCents: number;
  refundAmountCents: number;
  adjustmentAmountCents: number;
  
  // Dispute information
  reason: string;
  detailedDescription?: string;
  evidenceFiles?: string[];
  supportingDocumentation?: string[];
  
  // Stripe integration (if applicable)
  stripeDisputeId?: string;
  stripeDisputeStatus?: string;
  stripeEvidence?: string; // JSON string
  
  // Resolution
  resolutionOutcome?: 'accepted' | 'rejected' | 'partial_refund' | 'refunded' | 'adjusted';
  resolutionAmountCents: number;
  resolutionDate?: Date;
  resolutionNotes?: string;
  resolutionBy?: string;
  
  // Timeline
  disputeDate: Date;
  reviewDate?: Date;
  escalationDate?: Date;
  
  // Metadata
  disputeMetadata?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeAnalyticsCache {
  id: string;
  cacheKey: string;
  cacheType: 'dashboard_metrics' | 'report_data' | 'trend_analysis';
  
  // Cache data
  dataPeriodStart: string;
  dataPeriodEnd: string;
  cachedData: string; // JSON string
  
  // Cache metadata
  generatedAt: Date;
  expiresAt: Date;
  generationDurationMs?: number;
  
  // Usage tracking
  accessCount: number;
  lastAccessedAt?: Date;
  
  createdAt: Date;
}

export interface PaymentFilters {
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethodType?: string;
}

export interface ReturnFilters {
  achPaymentId?: string;
  returnCode?: string;
  corrected?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface CorrectionAction {
  method: string;
  date: string;
  notes?: string;
  amount?: number;
}

// ─── ISO 20022 Types ───────────────────────────────────────────────

export interface ISO20022Config {
  companyName: string;
  companyId: string;
  accountNumber: string;
  routingNumber: string;    // ABA routing for domestic ACH
  bic?: string;             // SWIFT/BIC for international
  iban?: string;            // IBAN for SEPA
  bankName?: string;
  bankCountry?: string;
}

export interface ISO20022PaymentInstruction {
  type: 'ach' | 'swift' | 'sepa' | 'rtp';
  direction: 'credit' | 'debit';
  amount: number;           // in smallest unit (cents)
  currency: string;
  creditorName: string;
  creditorAccountNumber?: string;
  creditorRoutingNumber?: string;
  creditorBic?: string;
  creditorIban?: string;
  remittanceInfo?: string;
}

export interface ISO20022GeneratedMessage {
  id: string;
  type: 'pain.001' | 'camt.053';
  paymentType: 'ach' | 'swift' | 'sepa' | 'rtp';
  xml: string;
  createdAt: Date;
  relatedPaymentIds: string[];
  messageId: string;
  totalAmount: number;
  totalInstructions: number;
}

export interface ParsedStatementTransaction {
  id: string;
  amount: number;
  currency: string;
  creditDebit: 'credit' | 'debit';
  date: string;
  description?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  reference?: string;
  matchedJournalEntryId?: string;
  matchStatus: 'matched' | 'unmatched' | 'partial';
}

export interface ParsedBankStatement {
  messageId: string;
  creationDate: string;
  accountId: string;
  statements: {
    accountId: string;
    openingBalance: number;
    closingBalance: number;
    currency: string;
    entries: ParsedStatementTransaction[];
  }[];
  totalTransactions: number;
}

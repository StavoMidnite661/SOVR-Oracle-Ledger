import type { Account, JournalEntry, PurchaseOrder, Invoice, Employee, Vendor, CompanyCard, CardTransaction, ConsulCreditsConfig, SupportedToken, ConsulCreditsTransaction, AchPayment, DirectDepositPayout, PaymentReconciliationEntry, StripeCustomer, AppSettings } from './types.js';
import { AccountType, Entity, SpendCategory } from './types.js';

export const CHART_OF_ACCOUNTS: Account[] = [
  // Assets
  { id: 1000, name: 'Cash-ODFI-LLC', type: AccountType.Asset, entity: Entity.LLC },
  { id: 1010, name: 'Cash-Vault-USDC', type: AccountType.Asset, entity: Entity.Trust },
  { id: 1050, name: 'ACH-Settlement-Account', type: AccountType.Asset, entity: Entity.LLC },
  { id: 1060, name: 'Stripe-Clearing-Account', type: AccountType.Asset, entity: Entity.LLC },
  { id: 1200, name: 'Intercompany-Receivable-Trust', type: AccountType.Asset, entity: Entity.Trust },
  { id: 1300, name: 'AR', type: AccountType.Asset, entity: Entity.LLC },
  { id: 1400, name: 'Inventory', type: AccountType.Asset, entity: Entity.LLC },
  
  // Liabilities
  { id: 2100, name: 'ACH-Clearing-LLC', type: AccountType.Liability, entity: Entity.LLC },
  { id: 2180, name: 'Direct-Deposit-Liabilities', type: AccountType.Liability, entity: Entity.LLC },
  { id: 2200, name: 'Intercompany-Payable-LLC', type: AccountType.Liability, entity: Entity.LLC },
  { id: 2300, name: 'AP', type: AccountType.Liability, entity: Entity.LLC },
  { id: 2400, name: 'Payroll-Liability', type: AccountType.Liability, entity: Entity.LLC },
  
  // Equity
  { id: 3000, name: 'LLC-Equity', type: AccountType.Equity, entity: Entity.LLC },
  { id: 3100, name: 'Trust-Capital', type: AccountType.Equity, entity: Entity.Trust },
  
  // Income/Expense
  { id: 4000, name: 'Token-Realization-Gain/Loss', type: AccountType.Income, entity: Entity.LLC },
  
  // Expenses
  { id: 6000, name: 'Payroll-Expense', type: AccountType.Expense, entity: Entity.LLC },
  { id: 6100, name: 'Ops-Expense', type: AccountType.Expense, entity: Entity.LLC },
  { id: 6150, name: 'ACH-Processing-Fees', type: AccountType.Expense, entity: Entity.LLC },
  { id: 6160, name: 'Stripe-Processing-Fees', type: AccountType.Expense, entity: Entity.LLC },
  { id: 6170, name: 'Bank-Charges-Expense', type: AccountType.Expense, entity: Entity.LLC },
  { id: 6180, name: 'Payment-Card-Fees', type: AccountType.Expense, entity: Entity.LLC },
  { id: 6200, name: 'Purchase-Expense', type: AccountType.Expense, entity: Entity.LLC },
];

export const mockJournalEntries: JournalEntry[] = [];
export const mockPurchaseOrders: PurchaseOrder[] = [];
export const mockInvoices: Invoice[] = [];
export const mockEmployees: Employee[] = [];
export const mockVendors: Vendor[] = [];
export const mockCompanyCards: CompanyCard[] = [];
export const mockCardTransactions: CardTransaction[] = [];

// Consul Credits Mock Data (Fallback for type safety, but points to Live)
export const mockConsulCreditsConfig: ConsulCreditsConfig = {
  contractAddress: '0x65e75d0fC656a2E81eF17E9A2A8Da58D82390422',
  networkName: 'Base Mainnet',
  chainId: 8453,
  rpcUrl: '/api/rpc',
  oracleIntegratorAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
  confirmationsRequired: 3,
  isEnabled: true,
};

export const CONSUL_CREDITS_CONFIG: ConsulCreditsConfig = {
  isEnabled: true,
  networkName: 'Base Mainnet',
  chainId: 8453,
  contractAddress: '0x65e75d0fC656a2E81eF17E9A2A8Da58D82390422',
  rpcUrl: '/api/rpc',
  oracleIntegratorAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
  confirmationsRequired: 3
};

export const mockSupportedTokens: SupportedToken[] = [];
export const mockConsulCreditsTransactions: ConsulCreditsTransaction[] = [];
export const mockAchPayments: AchPayment[] = [];
export const mockDirectDepositPayouts: DirectDepositPayout[] = [];

export const mockReconciliationEntries: PaymentReconciliationEntry[] = [];

export const mockStripeCustomers: StripeCustomer[] = [];


export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    appName: 'ORACLE-LEDGER',
    organizationName: 'SOVR Development Holdings LLC',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
  },
  connectivity: {
    rpcUrl: '/api/rpc',
    contractAddress: '0x18042545890dd72c4023ee8eb22b14babb034666',
    apiEndpoint: 'http://localhost:3002',
    websocketEndpoint: 'ws://localhost:3002',
  },
  security: {
    mfaEnabled: false,
    sessionTimeout: 30,
    auditLevel: 'Standard',
    pciComplianceMode: true,
  },
  appearance: {
    theme: 'Glass',
    accentColor: '#22d3ee',
    sidebarCompact: false,
  },
};

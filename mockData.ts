import type { 
  ConsulCreditsConfig, 
  SupportedToken, 
  ConsulCreditsTransaction, 
  ConsulCreditsStats 
} from './types.js';

export const mockConfig: ConsulCreditsConfig = {
  isEnabled: true,
  networkName: 'Base Mainnet',
  chainId: 8453,
  contractAddress: '0x65e75d0fC656a2E81eF17E9A2A8Da58D82390422',
  rpcUrl: '/api/rpc',
  oracleIntegratorAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
  confirmationsRequired: 3,
};

export const mockSupportedTokens: SupportedToken[] = [
  {
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    exchangeRate: '1.00',
    isActive: true,
    totalDeposited: '50000000000',
    totalWithdrawn: '10000000000',
  },
  {
    name: 'Tether USD',
    symbol: 'USDT',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    decimals: 6,
    exchangeRate: '1.00',
    isActive: true,
    totalDeposited: '25000000000',
    totalWithdrawn: '5000000000',
  },
  {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    exchangeRate: '3500.00',
    isActive: true,
    totalDeposited: '10000000000000000000',
    totalWithdrawn: '2000000000000000000',
  },
  {
    name: 'SOVR Vault Certificate',
    symbol: 'SOVRCVLT',
    address: '0x9876543210987654321098765432109876543210',
    decimals: 18,
    exchangeRate: '1.25',
    isActive: true,
    totalDeposited: '1000000000000000000000',
    totalWithdrawn: '100000000000000000000',
  },
  {
    name: 'USD Stablecoin SOVR',
    symbol: 'usdSOVR',
    address: '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422',
    decimals: 6,
    exchangeRate: '1.00',
    isActive: true,
    totalDeposited: '750000000000',
    totalWithdrawn: '50000000000',
  },
];

export const mockTransactions: ConsulCreditsTransaction[] = [
  {
    id: '1',
    txHash: '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc1',
    eventType: 'DEPOSIT',
    tokenSymbol: 'USDC',
    tokenAmount: '1000000000',
    consulCreditsAmount: '1000.00',
    userAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
    status: 'CONFIRMED',
    blockNumber: 123456,
    timestamp: new Date().toISOString(),
    ledgerReference: 'JOURNAL-101',
    journalEntryId: 'JE-001',
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    exchangeRate: '1.00',
    confirmations: 12
  },
  {
    id: '2',
    txHash: '0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abc2',
    eventType: 'WITHDRAW',
    tokenSymbol: 'USDT',
    tokenAmount: '500000000',
    consulCreditsAmount: '500.00',
    userAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
    status: 'CONFIRMED',
    blockNumber: 123457,
    timestamp: new Date().toISOString(),
    ledgerReference: 'JOURNAL-102',
    journalEntryId: 'JE-002',
    tokenAddress: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    exchangeRate: '1.00',
    confirmations: 10
  },
  {
    id: '3',
    txHash: '0xghi7890abcdef1234567890abcdef1234567890abcdef1234567890abc3',
    eventType: 'ORACLE_MINT',
    tokenSymbol: 'cUSD',
    tokenAmount: '25000',
    consulCreditsAmount: '250.00',
    userAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
    status: 'CONFIRMED',
    blockNumber: 123458,
    timestamp: new Date().toISOString(),
    ledgerReference: 'JOURNAL-103',
    journalEntryId: 'JE-003',
    tokenAddress: '0x65e75d0fC656a2E81eF17E9A2A8Da58D82390422',
    exchangeRate: '1.00',
    confirmations: 8
  }
];

export const mockStats: ConsulCreditsStats = {
  totalSupply: '100000.00',
  totalUniqueHolders: 150,
  totalTransactions: 1250,
  supportedTokensCount: 5,
  totalValueLockedUSD: '1250000.00',
  activeUsers: 245,
  contractReserves: [
    { tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', tokenSymbol: 'USDC', balance: '50000', value: '50000' },
    { tokenAddress: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', tokenSymbol: 'USDT', balance: '25000', value: '25000' },
    { tokenAddress: '0x4200000000000000000000000000000000000006', tokenSymbol: 'WETH', balance: '10', value: '35000' },
    { tokenAddress: '0x9876543210987654321098765432109876543210', tokenSymbol: 'SOVRCVLT', balance: '1000', value: '1250' },
    { tokenAddress: '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422', tokenSymbol: 'usdSOVR', balance: '750000', value: '750000' }
  ]
};

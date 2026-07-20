import { ethers } from 'ethers';
import type { 
  ConsulCreditsConfig, 
  SupportedToken, 
  ConsulCreditsTransaction, 
  ConsulCreditsBalance,
  ConsulCreditsStats,
  JournalEntry,
  AuditEvent
} from '../types.js';

// ConsulCreditsWrapper (USD-denominated, 2 decimals) - Updated ABI
const CONSUL_CREDITS_ABI = [
  // View functions
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function oracleIntegrator() view returns (address)",
  // Write functions (USD cents based)
  "function oracleMint(address to, uint256 amountCents, string memory ledgerReference)",
  "function oracleBurn(address from, uint256 amountCents, string memory ledgerReference)",
  "function setOracleIntegrator(address newIntegrator)",
  "function pause()",
  "function unpause()",
  "function emergencyWithdraw(address token, address to, uint256 amount)",
  // Events
  "event OracleIntegratorUpdated(address indexed oldIntegrator, address indexed newIntegrator)",
  "event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount)",
];

// Standard ERC-20 ABI for token interactions
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
];

export class ConsulCreditsService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private config: ConsulCreditsConfig | null = null;
  private eventListeners: Map<string, any> = new Map();
  private processedTransactions: Set<string> = new Set(); // For deduplication
  private signer: ethers.JsonRpcSigner | null = null;
  private walletAddress: string | null = null;

  constructor() {
    // Initialize with default config if available
    this.loadConfig();
  }

  /**
   * Initialize the service with blockchain configuration
   */
  async initialize(config: ConsulCreditsConfig): Promise<void> {
    try {
      // Check if config has changed to prevent infinite loops
      if (this.config && JSON.stringify(this.config) === JSON.stringify(config) && this.provider && this.contract) {
        console.log('Config unchanged, skipping initialization');
        return;
      }

      console.log('Starting initialization with config:', config);
      this.config = config;
      
      console.log('Starting initialization with config:', config);
      this.config = config;
      
      // Fallback RPCs if the primary one fails
      const rpcUrls = [
        config.rpcUrl,
        'https://mainnet.base.org',
        'https://base.llamarpc.com',
        'https://1rpc.io/base',
        'https://base.drpc.org'
      ].filter((url, index, self) => self.indexOf(url) === index && url); // Dedupe and filter empty

      let connected = false;
      let lastError = null;

      for (const url of rpcUrls) {
          try {
              console.log(`Attempting connection to RPC: ${url}`);
              let fullRpcUrl = url;
              if (typeof window !== 'undefined' && url.startsWith('/')) {
                fullRpcUrl = `${window.location.origin}${url}`;
              }

              const tempProvider = new ethers.JsonRpcProvider(fullRpcUrl);
              // Quick test
              await tempProvider.getNetwork();
              
              this.provider = tempProvider;
              console.log(`Successfully connected to RPC: ${url}`);
              connected = true;
              
              // Update config to reflect working URL
              this.config.rpcUrl = fullRpcUrl;
              break;
          } catch (err) {
              console.warn(`Failed to connect to RPC ${url}:`, err);
              lastError = err;
          }
      }

      if (!connected) {
          throw new Error(`Failed to connect to any RPC provider. Last error: ${lastError?.message}`);
      }
      
      console.log('Creating contract instance with address:', config.contractAddress);
      // Create contract instance
      this.contract = new ethers.Contract(
        config.contractAddress,
        CONSUL_CREDITS_ABI,
        this.provider
      );

      console.log('Verifying contract...');
      // Verify contract is deployed and accessible
      await this.verifyContract();
      
      console.log('ConsulCreditsService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ConsulCreditsService:', error);
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error:', error);
      }
      throw error;
    }
  }

  /**
   * Verify the contract is deployed and responsive
   */
  private async verifyContract(): Promise<void> {
    if (!this.contract || !this.provider || !this.config) throw new Error('Contract not initialized');
    
    try {
      // 1. First check if there is actual code at the address
      const code = await this.provider.getCode(this.config.contractAddress);
      if (code === '0x' || code === '0x0') {
        throw new Error(`NODE ERROR: No contract bytecode detected at ${this.config.contractAddress}. The address is either an EOA or empty on this network.`);
      }

      // 2. Test contract call
      try {
        await this.contract.totalSupply();
      } catch (callError: any) {
        console.error("Contract verification 'totalSupply' failed:", callError);
        
        // Detailed logging for CALL_EXCEPTION
        if (callError.code === 'CALL_EXCEPTION') {
          console.error("CALL_EXCEPTION details:", {
            action: callError.action,
            data: callError.data, // Raw revert data
            reason: callError.reason, // Revert reason
            transaction: callError.transaction,
            invocation: callError.invocation,
            revert: callError.revert
          });
        }
        throw callError;
      }
    } catch (error: any) {
      if (error.message.includes('NODE ERROR')) throw error;
      // Preserve the original error message if possible to show the full context
      throw new Error(`Contract synchronization failed: ${error.message || error}`);
    }
  }

  /**
   * Get supported tokens and their configuration
   */
  async getSupportedTokens(tokenAddresses: string[]): Promise<SupportedToken[]> {
    if (!this.contract) throw new Error('Service not initialized');

    const tokens: SupportedToken[] = [];

    // Prioritize usdSOVR if it's not in the list but configured
    const uniqueAddresses = new Set(tokenAddresses.map(a => a.toLowerCase()));
    if (this.config?.contractAddress && !uniqueAddresses.has(this.config.contractAddress.toLowerCase())) {
        // actually usdSOVR is the wrapper, not a supported token in the list normally? 
        // Wait, supported tokens are assets *inside* the wrapper. 
        // But usdSOVR is often listed as a token too.
    }

    for (const address of tokenAddresses) {
      // Retry logic for token details
      let retries = 3;
      while (retries > 0) {
          try {
            // Wrapper-specific checks (new contract has no wrapper functions, skip gracefully)
            let isSupported = false;
            let exchangeRate = BigInt(0);
            let reserves = BigInt(0);

            // Note: For new Boundary Adapter architecture, use BoundaryAdapter.getAdapterConfig()
            // or ReserveVault.balance() instead of wrapper-specific checks.
            try {
                isSupported = await this.contract.isTokenSupported?.(address).catch(() => false) || false;
                if (isSupported) {
                    exchangeRate = await this.contract.getExchangeRate?.(address).catch(() => BigInt(0)) || BigInt(0);
                    reserves = await this.contract.getTokenReserves?.(address).catch(() => BigInt(0)) || BigInt(0);
                }
            } catch (wrapperError) {
                // Ignore wrapper error — new architecture uses BoundaryAdapter
            }

            // Get token details (ERC20 standard - should always work for valid tokens)
            // Use static call to avoid massive overhead
            const tokenContract = new ethers.Contract(address, ERC20_ABI, this.provider);
            const [name, symbol, decimals] = await Promise.all([
              tokenContract.name().catch(() => 'Unknown'),
              tokenContract.symbol().catch(() => '???'),
              tokenContract.decimals().catch(() => 18)
            ]);

            tokens.push({
              address,
              symbol,
              name,
              decimals: Number(decimals),
              exchangeRate: exchangeRate.toString(),
              isActive: isSupported, // Might be false if wrapper check failed, but token exists
              totalDeposited: reserves.toString(), 
              totalWithdrawn: '0' 
            });
            break; // Success, exit retry loop
          } catch (error: any) {
            console.warn(`Failed to get details for token ${address} (Attempt ${4-retries}):`, error.message);
            retries--;
            if (retries === 0) { 
                console.error(`Give up on token ${address}`);
            } else {
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
            }
          }
      }
    }

    return tokens;
  }

  /**
   * Calculate consul credits for token deposit
   */
  async calculateConsulCredits(tokenAddress: string, tokenAmount: string): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');
    // New USD-denominated contract (2 decimals) — token amount = USD amount
    const amount = ethers.parseUnits(tokenAmount, 2);
    return ethers.formatUnits(amount, 2);
  }

  /**
   * Calculate token amount for consul credits withdrawal
   */
  async calculateTokenAmount(tokenAddress: string, consulCreditsAmount: string): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');
    // New USD-denominated contract (2 decimals) — token amount = USD amount
    const amount = ethers.parseUnits(consulCreditsAmount, 2);
    return ethers.formatUnits(amount, 2);
  }

  /**
   * Get user's consul credits balance
   */
  async getUserBalance(userAddress: string): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');

    const balance = await this.contract.balanceOf(userAddress);
    return ethers.formatUnits(balance, 2); // USD-denominated token (2 decimals)
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<ConsulCreditsStats> {
    if (!this.contract) throw new Error('Service not initialized');

    const totalSupply = await this.contract.totalSupply().catch(() => BigInt(0));

    return {
      totalSupply: ethers.formatUnits(totalSupply, 2), // 2 decimal USD token
      totalUniqueHolders: 0,
      totalTransactions: 0,
      supportedTokensCount: 0,
      contractReserves: []
    };
  }

  /**
   * Sovereign Mint — calls mint(address, uint256) on-chain.
   * Only callable by the contract owner wallet.
   * ledgerReference is logged off-chain (not a contract parameter).
   */
  async sovereignMint(
    toAddress: string,
    amount: string,
    ledgerReference: string,
    signerPrivateKey: string
  ): Promise<string> {
    if (!this.contract || !this.provider) throw new Error('Service not initialized');

    const signer = new ethers.Wallet(signerPrivateKey, this.provider);
    const contractWithSigner = this.contract.connect(signer) as ethers.Contract;

    // Verify signer is the contract oracle integrator or owner
    const integratorAddress = await this.contract.oracleIntegrator();
    const ownerAddress = await this.contract.owner?.() ?? integratorAddress;
    const authorized = integratorAddress || ownerAddress;
    if (signer.address.toLowerCase() !== (authorized || '').toLowerCase()) {
      throw new Error(
        `Signer ${signer.address} is not the contract integrator/owner ${authorized}. ` +
        `Only authorized oracle can mint cUSD. Update BLOCKCHAIN_SIGNER_KEY in .env.`
      );
    }

    const amountCents = ethers.parseUnits(amount, 2); // 2 decimals for USD

    console.log(`[SOVR] Minting ${amount} cUSD (cents) to ${toAddress} | Ref: ${ledgerReference}`);
    const tx = await contractWithSigner.oracleMint(toAddress, amountCents, ledgerReference);
    const receipt = await tx.wait();
    console.log(`[SOVR] Mint confirmed: ${tx.hash} (block ${receipt.blockNumber})`);
    return tx.hash;
  }

  /**
   * Sovereign Burn — calls burn(uint256) on-chain from the owner wallet.
   * Burns tokens from the signer's own balance to attest off-chain credits.
   * ledgerReference is logged off-chain (not a contract parameter).
   */
  async sovereignBurn(
    amount: string,
    ledgerReference: string,
    signerPrivateKey: string
  ): Promise<string> {
    if (!this.contract || !this.provider) throw new Error('Service not initialized');

    const signer = new ethers.Wallet(signerPrivateKey, this.provider);
    const contractWithSigner = this.contract.connect(signer) as ethers.Contract;

    const amountCents = ethers.parseUnits(amount, 2);

    // Verify the signer has enough balance to burn
    const balance = await this.contract.balanceOf(signer.address);
    if (balance < amountCents) {
      throw new Error(
        `Insufficient balance to burn. Signer ${signer.address} has ` +
        `${ethers.formatUnits(balance, 2)} cUSD but tried to burn ${amount}.`
      );
    }

    console.log(`[SOVR] Burning ${amount} cUSD from ${signer.address} | Ref: ${ledgerReference}`);
    const tx = await contractWithSigner.oracleBurn(signer.address, amountCents, ledgerReference);
    const receipt = await tx.wait();
    console.log(`[SOVR] Burn confirmed: ${tx.hash} (block ${receipt.blockNumber})`);
    return tx.hash;
  }

  /**
   * Sovereign Transfer — transfers usdSOVR from owner wallet to a user address.
   */
  async sovereignTransfer(
    toAddress: string,
    amount: string,
    signerPrivateKey: string
  ): Promise<string> {
    if (!this.contract || !this.provider) throw new Error('Service not initialized');

    const signer = new ethers.Wallet(signerPrivateKey, this.provider);
    const contractWithSigner = this.contract.connect(signer) as ethers.Contract;

    const amountCents = ethers.parseUnits(amount, 2);

    console.log(`[SOVR] Transferring ${amount} cUSD to ${toAddress}`);
    // Note: New contract uses standard ERC20 transfer (via transfer function if available)
    // If transfer is not in ABI, this requires direct call or contract upgrade.
    // For architecture alignment, using direct transfer call when supported.
    try {
      const tx = await contractWithSigner.transfer?.(toAddress, amountCents);
      if (!tx) throw new Error("transfer not available in ABI — use BoundaryAdapter.receiveAsset/releaseAsset or oracleMint/oracleBurn for settlement flows");
      const receipt = await tx.wait();
      console.log(`[SOVR] Transfer confirmed: ${tx.hash} (block ${receipt.blockNumber})`);
      return tx.hash;
    } catch (err: any) {
      throw new Error(`Sovereign transfer requires standard ERC20 transfer or BoundaryAdapter flow. Error: ${err.message}`);
    }
  }

  /**
   * Start listening for contract Transfer events (covers mint, burn, and transfer)
   */
  async startEventListening(
    onTransfer: (event: ConsulCreditsTransaction) => Promise<void>,
    _unused?: any
  ): Promise<void> {
    if (!this.contract || !this.config) throw new Error('Service not initialized');

    // Listen for Transfer events — this covers mint (from=0x0), burn (to=0x0), and transfers
    const transferListener = async (...args: any[]) => {
      const [from, to, value, event] = args;
      
      const transactionId = `${event.transactionHash}-${event.logIndex}`;
      
      if (this.processedTransactions.has(transactionId)) {
        return;
      }
      
      this.processedTransactions.add(transactionId);

      const isMint = from === ethers.ZeroAddress;
      const isBurn = to === ethers.ZeroAddress;
      
      const transaction: ConsulCreditsTransaction = {
        id: transactionId,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString(),
        eventType: isMint ? 'DEPOSIT' : isBurn ? 'WITHDRAW' : 'TRANSFER',
        userAddress: isMint ? to : from,
        tokenAddress: this.config!.contractAddress,
        tokenSymbol: 'usdSOVR',
        tokenAmount: ethers.formatUnits(value, 18),
        consulCreditsAmount: ethers.formatUnits(value, 18),
        exchangeRate: '1.0',
        ledgerReference: `onchain-${transactionId}`,
        confirmations: 0,
        status: 'PENDING'
      };

      await onTransfer(transaction);
    };

    this.contract.on('Transfer', transferListener);
    this.eventListeners.set('Transfer', transferListener);

    console.log('[SOVR] Event listening started for usdSOVR Transfer events');
  }

  /**
   * Stop event listening
   */
  stopEventListening(): void {
    if (!this.contract) return;

    for (const [eventName, listener] of this.eventListeners) {
      this.contract.off(eventName, listener);
    }
    
    this.eventListeners.clear();
    console.log('Event listening stopped');
  }

  /**
   * Create journal entry from consul credits transaction
   */
  createJournalEntryFromTransaction(
    transaction: ConsulCreditsTransaction,
    accountMapping: { consulCreditsAccount: number; tokenAccount: number; feeAccount?: number }
  ): Omit<JournalEntry, 'id'> {
    const isDeposit = transaction.eventType === 'DEPOSIT' || transaction.eventType === 'ORACLE_MINT';
    const description = isDeposit 
      ? `Consul Credits deposit: ${transaction.tokenSymbol} → Consul Credits`
      : `Consul Credits withdrawal: Consul Credits → ${transaction.tokenSymbol}`;

    return {
      date: transaction.timestamp.split('T')[0], // Extract date part
      description,
      source: 'CHAIN',
      status: transaction.status === 'CONFIRMED' ? 'Posted' : 'Pending',
      txHash: transaction.txHash,
      blockNumber: transaction.blockNumber,
      chainConfirmations: transaction.confirmations,
      lines: isDeposit ? [
        // Debit: Consul Credits (asset increase)
        { accountId: accountMapping.consulCreditsAccount, type: 'DEBIT', amount: parseFloat(transaction.consulCreditsAmount) },
        // Credit: Token deposit liability
        { accountId: accountMapping.tokenAccount, type: 'CREDIT', amount: parseFloat(transaction.consulCreditsAmount) }
      ] : [
        // Debit: Token withdrawal (reduce liability)
        { accountId: accountMapping.tokenAccount, type: 'DEBIT', amount: parseFloat(transaction.consulCreditsAmount) },
        // Credit: Consul Credits (asset decrease)
        { accountId: accountMapping.consulCreditsAccount, type: 'CREDIT', amount: parseFloat(transaction.consulCreditsAmount) }
      ]
    };
  }

  /**
   * Load configuration from environment or storage
   */
  /**
   * Load configuration from environment or storage
   */
  private loadConfig(): void {
    // Attempt to load from environment variables if available (Node.js environment)
    if (typeof process !== 'undefined' && process.env) {
      const config: ConsulCreditsConfig = {
        isEnabled: process.env.CONSUL_CREDITS_ENABLED === 'true' || true, // Default to true if not specified
        networkName: process.env.CONSUL_CREDITS_NETWORK || 'Base Mainnet',
        chainId: parseInt(process.env.CONSUL_CREDITS_CHAIN_ID || '8453'),
        contractAddress: process.env.CONSUL_CREDITS_CONTRACT || '0x65e75d0fC656a2E81eF17E9A2A8Da58D82390422', // usdSOVR on Base
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://base.llamarpc.com',
        oracleIntegratorAddress: process.env.ORACLE_INTEGRATOR_ADDRESS || '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
        confirmationsRequired: parseInt(process.env.CONSUL_CREDITS_CONFIRMATIONS || '1')
      };

      // Only set if we have at least a contract address and RPC URL
      if (config.contractAddress && config.rpcUrl) {
        console.log('Loaded Consul Credits config from environment:', { ...config, rpcUrl: '***' });
        this.config = config;
      }
    }
  }

  /**
   * Check if service is properly configured and initialized
   */
  isInitialized(): boolean {
    return !!(this.provider && this.contract && this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ConsulCreditsConfig | null {
    return this.config;
  }

  /** 
   * Connect to browser wallet (MetaMask/Phantom/Rabby/Coinbase)
   */
  async connectWallet(): Promise<string> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('No crypto wallet found. Please install RABBY, MetaMask or Phantom.');
    }

    try {
      // Request account access with proper eth_requestAccounts
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      
      // Explicitly request accounts (better UX)
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      
      this.signer = await browserProvider.getSigner();
      this.walletAddress = await this.signer.getAddress();
      
      console.log('Wallet connected:', this.walletAddress);
      return this.walletAddress;
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      // Better error messages
      if (error.code === 4001) {
        throw new Error('Connection rejected by user.');
      }
      throw error;
    }
  }

  // ============================================
  // NEW: Gas Estimation + ENS + Native Balance
  // ============================================

  /**
   * Estimate gas for a transaction (deposit or withdraw)
   */
  async estimateGasForOperation(
    operation: 'deposit' | 'withdraw',
    tokenAddress: string,
    amount: string
  ): Promise<{ gasLimit: string; gasPrice: string; estimatedCostETH: string }> {
    if (!this.signer || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const decimals = 18; // most tokens
      const amountParsed = ethers.parseUnits(amount, decimals);

      let txRequest: any;

      if (operation === 'deposit') {
        // Simulate approve + deposit
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        const spender = this.config?.contractAddress;

        // Estimate approve
        const approveGas = await tokenContract.approve.estimateGas(spender, amountParsed).catch(() => 60000n);
        
        // Estimate deposit
        const contractWithSigner = this.contract!.connect(this.signer);
        const depositGas = await (contractWithSigner as any).depositToken.estimateGas(tokenAddress, amountParsed, 'gas-estimate').catch(() => 150000n);

        const totalGas = approveGas + depositGas;
        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');

        const estimatedCost = totalGas * gasPrice;
        const costETH = ethers.formatEther(estimatedCost);

        return {
          gasLimit: totalGas.toString(),
          gasPrice: gasPrice.toString(),
          estimatedCostETH: costETH
        };
      } else {
        // Withdraw estimation
        const contractWithSigner = this.contract!.connect(this.signer);
        const withdrawGas = await (contractWithSigner as any).withdrawToken.estimateGas(tokenAddress, amountParsed, 'gas-estimate').catch(() => 120000n);

        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');

        const estimatedCost = withdrawGas * gasPrice;
        const costETH = ethers.formatEther(estimatedCost);

        return {
          gasLimit: withdrawGas.toString(),
          gasPrice: gasPrice.toString(),
          estimatedCostETH: costETH
        };
      }
    } catch (error) {
      console.warn('Gas estimation failed, using defaults:', error);
      return {
        gasLimit: '200000',
        gasPrice: ethers.parseUnits('2', 'gwei').toString(),
        estimatedCostETH: '0.0004'
      };
    }
  }

  /**
   * Get ENS name for the connected address (if available)
   */
  async getENSName(address: string): Promise<string | null> {
    if (!this.provider) return null;

    try {
      const name = await this.provider.lookupAddress(address);
      return name;
    } catch {
      return null;
    }
  }

  /**
   * Get native ETH balance of connected wallet
   */
  async getNativeETHBalance(address: string): Promise<string> {
    if (!this.provider) return '0';

    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch {
      return '0';
    }
  }

  /**
   * Switch network using wallet provider
   */
  async switchNetwork(chainId: number): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('No crypto wallet found');
    }

    const hexChainId = `0x${chainId.toString(16)}`;
    
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        // Add Base Mainnet if that's what we're switching to
        if (chainId === 8453) {
           try {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2105',
                  chainName: 'Base Mainnet',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                },
              ],
            });
          } catch (addError) {
            console.error('Failed to add network:', addError);
            throw addError;
          }
        } else if (chainId === 11155111) {
             // Add Sepolia if needed (though usually present)
             try {
                await (window as any).ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0xaa36a7',
                      chainName: 'Sepolia Testnet',
                      nativeCurrency: {
                        name: 'Sepolia ETH',
                        symbol: 'SEP',
                        decimals: 18,
                      },
                      rpcUrls: ['https://rpc.sepolia.org'],
                      blockExplorerUrls: ['https://sepolia.etherscan.io'],
                    },
                  ],
                });
             } catch (addError) {
                console.error('Failed to add Sepolia:', addError);
                throw addError;
             }
        } else {
            throw new Error(`Network ID ${chainId} not configured for auto-add.`);
        }
      } else {
        console.error('Failed to switch network:', switchError);
        throw switchError;
      }
    }
  }

  /**
   * Get user's balances for supported tokens
   */
  async getUserTokenBalances(userAddress: string, tokenAddresses: string[]): Promise<Map<string, string>> {
    const balances = new Map<string, string>();
    
    // Use browser provider if available (for better speed/consistency with wallet), otherwise fallback to read-only provider
    const provider = this.signer ? this.signer.provider : this.provider;
    
    if (!provider) throw new Error('No provider available');

    for (const address of tokenAddresses) {
      try {
        const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(userAddress).catch(() => BigInt(0));
        balances.set(address, balance.toString());
      } catch (error) {
        console.warn(`Failed to fetch balance for ${address}:`, error);
        balances.set(address, '0');
      }
    }
    
    return balances;
  }

  /**
   * Approve token spending for the wrapper contract
   */
  async approveToken(tokenAddress: string, amount: string): Promise<string> {
     if (!this.signer) {
       // If signer is not set, try to initialize it from window.ethereum
       if (typeof window !== 'undefined' && (window as any).ethereum) {
         try {
           const provider = new ethers.BrowserProvider((window as any).ethereum);
           this.signer = await provider.getSigner();
         } catch (e) {
             throw new Error('Wallet not connected');
         }
       } else {
          throw new Error('Wallet not connected');
       }
    }
    
    if (!this.config?.contractAddress) throw new Error('Contract address not configured');

    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      
      // Fetch decimals dynamically
      const decimals = await tokenContract.decimals().catch(() => 18);
      const amountParsed = ethers.parseUnits(amount, decimals);
      const spender = this.config.contractAddress;

      // START OPTIMIZATION: Check existing allowance
      const owner = await this.signer.getAddress();
      const currentAllowance = await tokenContract.allowance(owner, spender);
      
      if (currentAllowance >= amountParsed) {
          console.log(`Allowance already sufficient (${ethers.formatUnits(currentAllowance, decimals)}). Skipping approval.`);
          return "ALREADY_APPROVED";
      }
      // END OPTIMIZATION

      console.log(`Approving ${amount} (decimals: ${Number(decimals)}) for ${spender}`);
      const tx = await tokenContract.approve(spender, amountParsed);
      console.log('Approval tx sent:', tx.hash);
      await tx.wait(); // Wait for 1 confirmation
      console.log('Approval confirmed');
      
      return tx.hash;
    } catch (error: any) {
      console.error('Failed to approve token:', error);
      throw error;
    }
  }

  /**
   * DEPRECATED: Old wrapper deposit. Use BoundaryAdapter.receiveAsset() via Oracle integration,
   * or oracleMint() through the integrator for settlement flows.
   */
  async depositToken(tokenAddress: string, amount: string, reference: string): Promise<string> {
    throw new Error("depositToken is deprecated with Boundary Adapter v2. Use BoundaryAdapter.receiveAsset() or oracleMint() for settlement flows.");
  }

  /**
   * DEPRECATED: Old wrapper withdraw. Use BoundaryAdapter.releaseAsset() via Oracle integration,
   * or oracleBurn() through the integrator for settlement flows.
   */
  async withdrawToken(tokenAddress: string, consulCreditsAmount: string, reference: string): Promise<string> {
    throw new Error("withdrawToken is deprecated with Boundary Adapter v2. Use BoundaryAdapter.releaseAsset() or oracleBurn() for settlement flows.");
  }

  /**
   * Get transaction history from chain events
   */
  async getTransactions(userAddress?: string): Promise<ConsulCreditsTransaction[]> {
    if (!this.contract) throw new Error('Service not initialized');

    // Note: New contract (BoundarAdapter / cUSD) uses oracleMint/oracleBurn.
    // Event tracking requires listening to Transfer events (mint from 0x0, burn to 0x0)
    // or using BoundaryAdapter.eventTracking for settlement evidence.
    // For architecture alignment, this method returns an empty array with a log note.
    console.log(`[SOVR] Transaction tracking migrated to BoundaryAdapter / SettlementGateway evidence events.`);
    console.log(`Fetching transactions for user: ${userAddress || 'ALL'}`);
    return [];
  }
}

// Export singleton instance
export const consulCreditsService = new ConsulCreditsService();
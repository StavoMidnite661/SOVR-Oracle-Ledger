import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar.js';
import { Header } from './components/layout/Header.js';
import { DashboardView } from './views/DashboardView.js';
import { JournalView } from './views/JournalView.js';
import { ChartOfAccountsView } from './views/ChartOfAccountsView.js';
import { PurchaseOrdersView } from './views/PurchaseOrdersView.js';
import { AccountsReceivableView } from './views/AccountsReceivableView.js';
import { AccountsPayableView } from './views/AccountsPayableView.js';
import { VendorPaymentsView } from './views/VendorPaymentsView.js';
import { VendorManagementView } from './views/VendorManagementView.js';
import { CardManagementView } from './views/CardManagementView.js';
import { ConsulCreditsView } from './views/ConsulCreditsView.js';
import { StripePaymentsView } from './views/StripePaymentsView.js';
import { StripeSettingsView } from './views/StripeSettingsView.js';
import { StripeComplianceView } from './views/StripeComplianceView.js';
import { StripeReportsView } from './views/StripeReportsView.js';
import { PayrollView } from './views/PayrollView.js';
import { SettingsView } from './views/SettingsView.js';
import { ISO20022View } from './views/ISO20022View.js';
import { mockConfig, mockSupportedTokens, mockTransactions, mockStats } from './mockData.js';
import { mockJournalEntries, mockPurchaseOrders, mockInvoices, mockEmployees, mockVendors, mockCompanyCards, mockCardTransactions, mockStripeCustomers, mockAchPayments, mockDirectDepositPayouts, DEFAULT_SETTINGS, CONSUL_CREDITS_CONFIG, mockConsulCreditsConfig } from './constants.js';
import type { JournalEntry, PurchaseOrder, Invoice, Employee, Vendor, CompanyCard, CardTransaction, ConsulCreditsConfig, SupportedToken, ConsulCreditsTransaction, ConsulCreditsStats, StripeCustomer, AchPayment, DirectDepositPayout, AppSettings } from './types.js';
import { View } from './types.js';
import { Modal } from './components/shared/Modal.js';
import { consulCreditsService } from './services/consulCreditsService.js';
import { apiService } from './services/apiService.js';
import { UserManualContent } from './components/shared/UserManualContent.js';
import { TermsAndConditionsContent } from './components/shared/TermsAndConditionsContent.js';
import { SystemConsole } from './components/shared/SystemConsole.js';
import { ErrorBoundary } from './components/shared/ErrorBoundary.js';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Dashboard);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    // Persist last connected wallet address
    if (typeof window !== 'undefined') {
      return localStorage.getItem('connectedWalletAddress') || null;
    }
    return null;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [arInvoices, setArInvoices] = useState<Invoice[]>([]);
  const [apInvoices, setApInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [companyCards, setCompanyCards] = useState<CompanyCard[]>([]);
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [consulCreditsConfig, setConsulCreditsConfig] = useState<ConsulCreditsConfig | null>(CONSUL_CREDITS_CONFIG);
  const [supportedTokens, setSupportedTokens] = useState<SupportedToken[]>(mockSupportedTokens);
  const [consulCreditsTransactions, setConsulCreditsTransactions] = useState<ConsulCreditsTransaction[]>(mockTransactions);
  const [consulCreditsStats, setConsulCreditsStats] = useState<ConsulCreditsStats | null>(mockStats);
  
  // Stripe Data State
  const [stripeCustomers, setStripeCustomers] = useState<StripeCustomer[]>([]);
  const [achPayments, setAchPayments] = useState<AchPayment[]>([]);
  const [directDepositPayouts, setDirectDepositPayouts] = useState<DirectDepositPayout[]>([]);
  const [complianceChecklist, setComplianceChecklist] = useState<any[]>([]);
  const [pciAuditLogs, setPciAuditLogs] = useState<any[]>([]);
  const [achReturns, setAchReturns] = useState<any[]>([]);

  const [useMockData, setUseMockData] = useState(false);
  
  // NEW: Demo mode indicator (shows when running without backend - useful for Vercel)
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const contractAddress = settings.connectivity.contractAddress;
  const setContractAddress = (address: string) => {
    setSettings(prev => ({
      ...prev,
      connectivity: { ...prev.connectivity, contractAddress: address }
    }));
  };

  const intercompanyPayableBalance = useMemo(() => {
    return journalEntries.reduce((balance, entry) => {
      const payableLine = entry.lines.find(line => line.accountId === 2200);
      if (payableLine) {
        if (payableLine.type === 'CREDIT') return balance + payableLine.amount;
        if (payableLine.type === 'DEBIT') return balance - payableLine.amount;
      }
      return balance;
    }, 0);
  }, [journalEntries]);

  // ... (Add helper functions like addJournalEntry here if needed, omitted for brevity but should be kept)
  const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    if (useMockData) return;
    try {
      const newEntry = await apiService.addJournalEntry(entry);
      setJournalEntries(prev => [newEntry, ...prev]);
    } catch (err) { setError('Failed to add journal entry'); }
  };

  const addPurchaseOrder = async (entry: Omit<PurchaseOrder, 'id' | 'date'>) => {
    if (useMockData) return;
    try {
      const newOrder = await apiService.addPurchaseOrder(entry);
      setPurchaseOrders(prev => [newOrder, ...prev]);
    } catch (err) { setError('Failed to add purchase order'); }
  };

  const addArInvoice = async (entry: Omit<Invoice, 'id' | 'issueDate' | 'type'>) => {
    if (useMockData) return;
    try {
      const newInvoice = await apiService.addInvoice({ ...entry, type: 'AR' });
      setArInvoices(prev => [newInvoice, ...prev]);
    } catch (err) { setError('Failed to add AR invoice'); }
  };

  const addApInvoice = async (entry: Omit<Invoice, 'id' | 'issueDate' | 'type'>) => {
    if (useMockData) return;
    try {
      const newInvoice = await apiService.addInvoice({ ...entry, type: 'AP' });
      setApInvoices(prev => [newInvoice, ...prev]);
    } catch (err) { setError('Failed to add AP invoice'); }
  };

  const updateApInvoiceStatus = async (invoiceId: string, status: Invoice['status']) => {
    if (useMockData) return;
    try {
      const updatedInvoice = await apiService.updateInvoiceStatus(invoiceId, status);
      setApInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInvoice : inv)));
    } catch (err) { setError('Failed to update AP invoice status'); }
  };

  const addEmployee = async (entry: Omit<Employee, 'id'>) => {
    if (useMockData) return;
    try {
      const newEmployee = await apiService.addEmployee(entry);
      setEmployees(prev => [newEmployee, ...prev]);
    } catch (err) { setError('Failed to add employee'); }
  };

  const updateEmployee = async (updatedEmployee: Employee) => {
    if (useMockData) return;
    try {
      const updated = await apiService.updateEmployee(updatedEmployee);
      setEmployees(prev => prev.map(emp => (emp.id === updatedEmployee.id ? updated : emp)));
    } catch (err) { setError('Failed to update employee'); }
  };

  const addVendor = async (entry: Omit<Vendor, 'id' | 'createdDate'>) => {
    if (useMockData) return;
    try {
      const newVendor = await apiService.addVendor(entry);
      setVendors(prev => [newVendor, ...prev]);
    } catch (err) { setError('Failed to add vendor'); }
  };

  const updateVendor = async (updatedVendor: Vendor) => {
    if (useMockData) return;
    try {
      const updated = await apiService.updateVendor(updatedVendor);
      setVendors(prev => prev.map(v => (v.id === updatedVendor.id ? updated : v)));
    } catch (err) { setError('Failed to update vendor'); }
  };

  const onCreateStripeCustomer = async (customerData: Partial<StripeCustomer>) => {
    if (useMockData) return;
    try {
      const newCustomer = await apiService.createStripeCustomer(customerData);
      setStripeCustomers(prev => [...prev, newCustomer]);
    } catch (err) { setError('Failed to create Stripe customer'); }
  };

  const onCollectViaACH = async (invoice: Invoice) => {
    if (useMockData) return;
    try {
      await apiService.collectViaACH(invoice.id);
      // Refresh invoices or show success
      const updatedInvoices = await apiService.getInvoices();
      const arOnly = updatedInvoices.filter(inv => inv.type === 'AR');
      setArInvoices(arOnly);
    } catch (err) { setError('Failed to collect via ACH'); }
  };

  const onPayViaACH = async (invoiceId: string) => {
    if (useMockData) return;
    try {
      await apiService.payViaACH(invoiceId);
      const updatedInvoices = await apiService.getInvoices();
      const apOnly = updatedInvoices.filter(inv => inv.type === 'AP');
      setApInvoices(apOnly);
    } catch (err) { setError('Failed to pay via ACH'); }
  };

  const addCompanyCard = async (entry: Omit<CompanyCard, 'id' | 'issueDate' | 'spentThisMonth' | 'spentThisQuarter' | 'spentThisYear' | 'lastActivity'>) => {
    if (useMockData) return;
    try {
      const cardWithDefaults = { ...entry, issueDate: new Date().toISOString().split('T')[0], spentThisMonth: 0, spentThisQuarter: 0, spentThisYear: 0, lastActivity: undefined };
      const newCard = await apiService.addCompanyCard(cardWithDefaults);
      setCompanyCards(prev => [newCard, ...prev]);
    } catch (err) { setError('Failed to add company card'); }
  };

  const updateCompanyCard = async (cardId: string, updates: Partial<CompanyCard>) => {
    if (useMockData) return;
    try {
      const fullCard = companyCards.find(card => card.id === cardId);
      if (!fullCard) throw new Error('Card not found');
      const updatedCard = await apiService.updateCompanyCard({ ...fullCard, ...updates });
      setCompanyCards(prev => prev.map(card => (card.id === cardId ? updatedCard : card)));
    } catch (err) { setError('Failed to update company card'); }
  };

  const updateConsulCreditsConfig = (updates: Partial<ConsulCreditsConfig>) => {
    setConsulCreditsConfig(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await consulCreditsService.switchNetwork(chainId);
      // The chainChanged event listener will handle state updates
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert('Failed to switch network. Please check your wallet.');
    }
  };

  // Monitor Wallet Network
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleChainChanged = (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16);
        console.log(`Network changed to: ${chainId}`);
        
        let networkName = 'Unknown Network';
        if (chainId === 8453) networkName = 'Base Mainnet';
        else if (chainId === 11155111) networkName = 'Sepolia Testnet';
        else if (chainId === 1) networkName = 'Ethereum Mainnet';

        setConsulCreditsConfig(prev => ({
          ...(prev || CONSUL_CREDITS_CONFIG),
          chainId,
          networkName,
          isEnabled: true, // Force enabled in live mode
          contractAddress: chainId === 8453 
            ? '0x65e75d0fC656a2E81eF17E9A2A8Da58D82390422' 
            : (prev?.contractAddress || '0x65e75d0fC656a2E81eF17E9A2A8Da58D82390422')
        }));
      };

      (window as any).ethereum.on('chainChanged', handleChainChanged);
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          console.log('Wallet disconnected');
          setWalletAddress(null);
          localStorage.removeItem('connectedWalletAddress');
          setSupportedTokens(prev => prev.map(t => ({ ...t, userWalletBalance: undefined })));
        } else {
          console.log('Account changed to:', accounts[0]);
          setWalletAddress(accounts[0]);
          localStorage.setItem('connectedWalletAddress', accounts[0]);
        }
      };
      
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Check initial chain
      (window as any).ethereum.request({ method: 'eth_chainId' })
        .then(handleChainChanged)
        .catch(console.error);

      // Check initial accounts (auto-connect if already authorized)
      (window as any).ethereum.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch(console.error);

      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
          (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setIsDemoMode(false);

      if (useMockData) {
        setJournalEntries(mockJournalEntries);
        setPurchaseOrders(mockPurchaseOrders);
        setArInvoices(mockInvoices.filter(inv => inv.type === 'AR'));
        setApInvoices(mockInvoices.filter(inv => inv.type === 'AP'));
        setEmployees(mockEmployees);
        setVendors(mockVendors);
        setCompanyCards(mockCompanyCards);
        setCardTransactions(mockCardTransactions);
        setConsulCreditsConfig(mockConfig);
        setSupportedTokens(mockSupportedTokens);
        setConsulCreditsTransactions(mockTransactions);
        setConsulCreditsStats(mockStats);
        setStripeCustomers(mockStripeCustomers);
        setAchPayments(mockAchPayments);
        setDirectDepositPayouts(mockDirectDepositPayouts);
        setIsDemoMode(true);
      } else {
        try {
          const results = await Promise.allSettled([
            apiService.getJournalEntries(),
            apiService.getPurchaseOrders(),
            apiService.getInvoices(),
            apiService.getEmployees(),
            apiService.getVendors(),
            apiService.getCompanyCards(),
            apiService.getCardTransactions(),
            apiService.getConsulCreditsConfig(), // Index 7
            apiService.getConsulCreditsTransactions(),
            apiService.getStripeCustomers(),    // Index 9
            apiService.getAchPayments(),
            apiService.getDirectDepositPayouts(),
            apiService.getComplianceChecklist(),
            apiService.getPciAuditLogs(),
            apiService.getAchReturns()
          ]);

          // Helper to get value or default
          function getValue<T>(result: PromiseSettledResult<T>, defaultVal: T): T {
            return result.status === 'fulfilled' ? result.value : defaultVal;
          }

          setJournalEntries(getValue(results[0], []));
          setPurchaseOrders(getValue(results[1], []));
          const invoices = getValue(results[2], []);
          setArInvoices(invoices.filter(inv => inv.type === 'AR'));
          setApInvoices(invoices.filter(inv => inv.type === 'AP'));
          setEmployees(getValue(results[3], []));
          setVendors(getValue(results[4], []));
          setCompanyCards(getValue(results[5], []));
          setCardTransactions(getValue(results[6], []));
          
          
          const configData = getValue(results[7], null);
          if (configData) {
            // Ensure chainId is a number
            configData.chainId = parseInt(String(configData.chainId), 10);
            configData.isEnabled = true; // Force enabled for UI consistency
          }
          setConsulCreditsConfig(configData);
          
          // Initial live transaction fetch if service is initialized (or try initializing first)
          // We moved transaction fetching to after service init below
          
          setStripeCustomers(getValue(results[9], []));
          
          setStripeCustomers(getValue(results[9], []));
          setAchPayments(getValue(results[10], []));
          setDirectDepositPayouts(getValue(results[11], []));
          setComplianceChecklist(getValue(results[12], []));
          setPciAuditLogs(getValue(results[13], []));
          setAchReturns(getValue(results[14], []));

          // Log failures for debugging
          results.forEach((res, idx) => {
            if (res.status === 'rejected') {
              console.warn(`Data fetch failed for index ${idx}:`, res.reason);
            }
          });
          
          if (configData) {
            await consulCreditsService.initialize(configData);
            
            // Try fetching stats
            try {
              const stats = await consulCreditsService.getContractStats();
              setConsulCreditsStats(stats);
            } catch (statsErr) {
              console.warn("Failed to fetch contract stats (RPC issue), keeping mock stats:", statsErr);
            }
            
            // Try fetching supported tokens
            try {
              // Load supported tokens from contract only
              const tokenAddresses = mockSupportedTokens.map(t => t.address); 
              const fetchedTokens = await consulCreditsService.getSupportedTokens(tokenAddresses);
              
              // Merge fetched data with static metadata to ensure UI always shows correct names/symbols
              const mergedTokens = fetchedTokens.map(fetched => {
                const staticData = mockSupportedTokens.find(m => m.address.toLowerCase() === fetched.address.toLowerCase());
                return staticData ? {
                  ...fetched,
                  name: (fetched.name === 'Unknown' || !fetched.name) ? staticData.name : fetched.name,
                  symbol: (fetched.symbol === '???' || !fetched.symbol) ? staticData.symbol : fetched.symbol,
                  decimals: staticData.decimals // Trust static decimals
                } : fetched;
              });
              
              setSupportedTokens(mergedTokens);
            } catch (initErr) {
               console.error("Consul Service Init Failed:", initErr);
            }

            // Fetch Live Transactions
            try {
                const liveTxs = await consulCreditsService.getTransactions(walletAddress || undefined);
                // Resolve symbols
                const resolvedTxs = liveTxs.map(tx => {
                    const knownToken = mockSupportedTokens.find(t => t.address.toLowerCase() === tx.tokenAddress.toLowerCase());
                    return knownToken ? { ...tx, tokenSymbol: knownToken.symbol } : tx;
                });
                setConsulCreditsTransactions(resolvedTxs);
            } catch (txErr) {
                console.warn("Failed to fetch live transactions:", txErr);
            }
          }
        } catch (err) {
          console.error("Critical failure in loadData", err);
          
          // NEW: Automatic fallback to mock data if backend is unavailable (Vercel / no DB)
          console.warn("Backend unavailable — falling back to mock data (Demo Mode)");
          setUseMockData(true);
          setIsDemoMode(true);
          setError(null);
          
          // Load mock data as fallback
          setJournalEntries(mockJournalEntries);
          setPurchaseOrders(mockPurchaseOrders);
          setArInvoices(mockInvoices.filter(inv => inv.type === 'AR'));
          setApInvoices(mockInvoices.filter(inv => inv.type === 'AP'));
          setEmployees(mockEmployees);
          setVendors(mockVendors);
          setCompanyCards(mockCompanyCards);
          setCardTransactions(mockCardTransactions);
          setConsulCreditsConfig(mockConfig);
          setSupportedTokens(mockSupportedTokens);
          setConsulCreditsTransactions(mockTransactions);
          setConsulCreditsStats(mockStats);
          setStripeCustomers(mockStripeCustomers);
          setAchPayments(mockAchPayments);
          setDirectDepositPayouts(mockDirectDepositPayouts);
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [useMockData]);

  // Effect to refresh balances when wallet connects/disconnects
  useEffect(() => {
    const refreshBalances = async () => {
      if (walletAddress && supportedTokens.length > 0) {
        console.log('Wallet connected, refreshing balances for', walletAddress);
        try {
          const tokenAddresses = supportedTokens.map(t => t.address);
          // Use the wallet provider to fetch balances
          const userBalances = await consulCreditsService.getUserTokenBalances(walletAddress, tokenAddresses);
          
          setSupportedTokens(prevTokens => prevTokens.map(token => {
            const bal = userBalances.get(token.address);
            return bal ? { ...token, userWalletBalance: bal } : token;
          }));
        } catch (err) {
          console.error("Failed to refresh user balances:", err);
        }
      }
    };
    refreshBalances();
  }, [walletAddress, supportedTokens.length]);

  // Keyboard shortcut for console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        setIsConsoleOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isConsoleOpen) {
        setIsConsoleOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConsoleOpen]);

  // Handle settings changes (re-initialize services if needed)
  useEffect(() => {
    if (!useMockData && settings.connectivity.contractAddress && settings.connectivity.rpcUrl) {
      console.log('Connectivity settings changed, re-initializing services...');
      const reinit = async () => {
        try {
          await consulCreditsService.initialize({
            contractAddress: settings.connectivity.contractAddress,
            networkName: 'Base Mainnet',
            chainId: 8453,
            rpcUrl: settings.connectivity.rpcUrl,
            oracleIntegratorAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
            confirmationsRequired: 1,
            isEnabled: true
          });
          // Try fetching stats
          try {
            const stats = await consulCreditsService.getContractStats();
            setConsulCreditsStats(stats);
          } catch (statsErr) {
            console.warn("Failed to fetch contract stats (RPC issue), keeping mock stats:", statsErr);
          }
          
          // Try fetching supported tokens
          try {
            const tokenAddresses = mockSupportedTokens.map(t => t.address);
            const fetchedTokens = await consulCreditsService.getSupportedTokens(tokenAddresses);
            setSupportedTokens(fetchedTokens);
            
            // If wallet connected, fetch user balances
            if (walletAddress) {
              try {
                const userBalances = await consulCreditsService.getUserTokenBalances(walletAddress, tokenAddresses);
                
                setSupportedTokens(prev => prev.map(token => {
                  const bal = userBalances.get(token.address);
                  return bal ? { ...token, userWalletBalance: bal } : token;
                }));
              } catch (walletErr) {
                 console.error("Failed to fetch user balances:", walletErr);
              }
            }
          } catch (tokenBlockErr) {
             console.error("Critical error in token loading block:", tokenBlockErr);
          }
        } catch (err) {
          console.error("Critical error in data loading:", err);
          const message = err instanceof Error ? err.message : String(err);
          setError(`CORE SYNCHRONIZATION FAILURE: ${message}`);
        }
      };
      reinit();
    }
  }, [settings.connectivity.contractAddress, settings.connectivity.rpcUrl, useMockData, walletAddress]);

  const handleConnectWallet = async () => {
    // If already connected, disconnect
    if (walletAddress) {
      setWalletAddress(null);
      localStorage.removeItem('connectedWalletAddress');
      setSupportedTokens(prev => prev.map(t => ({ ...t, userWalletBalance: undefined })));
      console.log('Wallet disconnected by user');
      return;
    }

    try {
      // Enhanced wallet detection
      if (typeof window !== 'undefined' && !(window as any).ethereum) {
        alert("No crypto wallet detected. Please install Rabby, MetaMask, or Coinbase Wallet.");
        return;
      }

      const address = await consulCreditsService.connectWallet();
      setWalletAddress(address);
      localStorage.setItem('connectedWalletAddress', address);
      
      // Immediate network check
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        
        if (chainId !== 8453) {
          console.warn(`Connected to wrong network (${chainId}). Requesting switch to Base Mainnet...`);
          try {
            await handleSwitchNetwork(8453);
          } catch (switchErr) {
            console.error("Network switch rejected during connection:", switchErr);
          }
        }
      }

      // Refresh token balances with user wallet
      const tokenAddresses = supportedTokens.map(t => t.address);
      try {
        const userBalances = await consulCreditsService.getUserTokenBalances(address, tokenAddresses);
        setSupportedTokens(prev => prev.map(token => {
          const bal = userBalances.get(token.address);
          return bal ? { ...token, userWalletBalance: bal } : token;
        }));
      } catch (balErr) {
        console.error("Failed to fetch initial balances:", balErr);
      }
      
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      let errorMessage = "Failed to connect wallet.";
      if (error.code === 4001) {
        errorMessage = "Connection rejected by user.";
      } else if (error.message && error.message.includes("No crypto wallet")) {
        errorMessage = "No wallet found. Please install Rabby or MetaMask.";
      }
      alert(errorMessage);
    }

  };

  const handleDepositToken = async (tokenAddress: string, amount: string): Promise<string> => {
    if (!walletAddress) {
      alert('Please connect your wallet first.');
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log(`Initiating deposit of ${amount} for ${tokenAddress}`);
      
      // 1. Approve
      console.log('Requesting approval...');
      await consulCreditsService.approveToken(tokenAddress, amount);
      
      // 2. Deposit
      const reference = `DEP-${Date.now()}`; // Simple unique reference
      console.log('Requesting deposit...');
      const txHash = await consulCreditsService.depositToken(tokenAddress, amount, reference);
      
      // Return hash for UI display
      return txHash;

    } catch (error: any) {
      console.error('Deposit flow failed:', error);
      throw error;
    }
  };

  // NEW: Withdraw handler (was missing - critical fix)
  const handleWithdrawToken = async (tokenAddress: string, amount: string): Promise<string> => {
    if (!walletAddress) {
      alert('Please connect your wallet first.');
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log(`Initiating withdraw of ${amount} CC for ${tokenAddress}`);
      
      const reference = `WD-${Date.now()}`;
      const txHash = await consulCreditsService.withdrawToken(tokenAddress, amount, reference);
      
      // Refresh balances after successful withdraw
      const tokenAddresses = supportedTokens.map(t => t.address);
      try {
        const userBalances = await consulCreditsService.getUserTokenBalances(walletAddress, tokenAddresses);
        setSupportedTokens(prev => prev.map(token => {
          const bal = userBalances.get(token.address);
          return bal ? { ...token, userWalletBalance: bal } : token;
        }));
      } catch (e) {
        console.warn('Balance refresh after withdraw failed:', e);
      }
      
      return txHash;

    } catch (error: any) {
      console.error('Withdraw flow failed:', error);
      throw error;
    }
  };

  // NEW: Manual balance refresh (improvement)
  const refreshWalletBalances = async () => {
    if (!walletAddress) return;
    
    try {
      const tokenAddresses = supportedTokens.map(t => t.address);
      const userBalances = await consulCreditsService.getUserTokenBalances(walletAddress, tokenAddresses);
      
      setSupportedTokens(prev => prev.map(token => {
        const bal = userBalances.get(token.address);
        return bal ? { ...token, userWalletBalance: bal } : token;
      }));
      
      console.log('Wallet balances refreshed manually');
    } catch (err) {
      console.error('Manual balance refresh failed:', err);
    }
  };

  // NEW: Gas estimation helper (exposed to UI)
  const estimateTransactionGas = async (
    operation: 'deposit' | 'withdraw',
    tokenAddress: string,
    amount: string
  ) => {
    try {
      return await consulCreditsService.estimateGasForOperation(operation, tokenAddress, amount);
    } catch (err) {
      console.error('Gas estimation error:', err);
      return { gasLimit: '200000', gasPrice: '2000000000', estimatedCostETH: '0.0004' };
    }
  };

  // NEW: Get ENS + Native ETH balance
  const [ensName, setEnsName] = useState<string | null>(null);
  const [nativeETHBalance, setNativeETHBalance] = useState<string>('0');

  useEffect(() => {
    const loadENSAndNativeBalance = async () => {
      if (!walletAddress) {
        setEnsName(null);
        setNativeETHBalance('0');
        return;
      }

      try {
        const [name, ethBal] = await Promise.all([
          consulCreditsService.getENSName(walletAddress),
          consulCreditsService.getNativeETHBalance(walletAddress)
        ]);
        setEnsName(name);
        setNativeETHBalance(ethBal);
      } catch (e) {
        console.warn('ENS / ETH balance fetch failed:', e);
      }
    };

    loadENSAndNativeBalance();
  }, [walletAddress]);

  // Real-time Data Refresh for Consul Credits
  useEffect(() => {
    if (activeView !== View.ConsulCredits || useMockData) return;

    const refreshData = async () => {
      try {
        // 1. Refresh Config & Stats
        if (consulCreditsService.isInitialized()) {
          const stats = await consulCreditsService.getContractStats();
          setConsulCreditsStats(prev => JSON.stringify(prev) !== JSON.stringify(stats) ? stats : prev);
          
          // 2. Refresh Transactions directly from Blockchain (Service)
          // We bypass apiService which serves backend data, because we want direct chain data
          const liveTxs = await consulCreditsService.getTransactions(walletAddress || undefined);
          
          // Resolve symbols
          const resolvedTxs = liveTxs.map(tx => {
             const knownToken = mockSupportedTokens.find(t => t.address.toLowerCase() === tx.tokenAddress.toLowerCase());
             return knownToken ? { ...tx, tokenSymbol: knownToken.symbol } : tx;
          });

          setConsulCreditsTransactions(prev => JSON.stringify(prev) !== JSON.stringify(resolvedTxs) ? resolvedTxs : prev);
        }
      } catch (err) {
        console.warn('Background refresh failed:', err);
      }
    };

    // Initial refresh on view enter
    refreshData();

    // Poll every 15 seconds
    const intervalId = setInterval(refreshData, 15000);

    return () => clearInterval(intervalId);
  }, [activeView, useMockData, walletAddress]); // Added walletAddress dependency

  // Live Blockchain Event Listeners
  useEffect(() => {
    if (activeView === View.ConsulCredits && !useMockData && consulCreditsService.isInitialized()) {
      const handleTransactionEvent = async (tx: ConsulCreditsTransaction) => {
        console.log('New Live Transaction Event:', tx);
        
        // Resolve symbol for the new event
        const knownToken = mockSupportedTokens.find(t => t.address.toLowerCase() === tx.tokenAddress.toLowerCase());
        const resolvedTx = knownToken ? { ...tx, tokenSymbol: knownToken.symbol } : tx;

        setConsulCreditsTransactions(prev => {
            // Check if already exists to prevent duplicates
            if (prev.find(p => p.txHash === tx.txHash)) return prev;
            return [resolvedTx, ...prev];
        });
        
        // Refresh stats on new transaction
        try {
          const stats = await consulCreditsService.getContractStats();
          setConsulCreditsStats(stats);
        } catch (err) {
          console.error('Failed to update stats after event:', err);
        }
      };

      consulCreditsService.startEventListening(handleTransactionEvent, handleTransactionEvent);

      return () => {
        consulCreditsService.stopEventListening();
      };
    }
  }, [activeView, useMockData, consulCreditsConfig]); // Re-run if config/network changes

  const renderView = () => {
    if (isLoading) return <div>Loading...</div>;
    // We render anyway so the UI structure is visible even with errors, 
    // but typically we'd show an error state. 
    // For now, let's allow partial rendering.

    switch (activeView) {
      case View.Dashboard: return <DashboardView 
        journalEntries={journalEntries} 
        addJournalEntry={addJournalEntry} 
        purchaseOrders={purchaseOrders} 
        arInvoices={arInvoices} 
        apInvoices={apInvoices} 
        intercompanyPayableBalance={intercompanyPayableBalance}
        stripeCustomers={stripeCustomers}
        achPayments={achPayments}
        directDepositPayouts={directDepositPayouts}
        vendors={vendors}
        consulCreditsStats={consulCreditsStats}
      />;
      case View.Journal: return <JournalView journalEntries={journalEntries} addJournalEntry={addJournalEntry} vendors={vendors} />;
      case View.ChartOfAccounts: return <ChartOfAccountsView journalEntries={journalEntries} />;
      case View.PurchaseOrders: return <PurchaseOrdersView purchaseOrders={purchaseOrders} addPurchaseOrder={addPurchaseOrder} />;
      case View.AccountsReceivable: return <AccountsReceivableView 
        invoices={arInvoices} 
        addInvoice={addArInvoice} 
        stripeCustomers={stripeCustomers}
        achPayments={achPayments}
      />;
      case View.AccountsPayable: return <AccountsPayableView 
        invoices={apInvoices} 
        addInvoice={addApInvoice} 
        vendors={vendors}
        achPayments={achPayments}
      />;
      case View.VendorPayments: return <VendorPaymentsView 
        invoices={apInvoices} 
        updateInvoiceStatus={updateApInvoiceStatus} 
        addJournalEntry={addJournalEntry} 
        vendors={vendors}
        achPayments={achPayments}
      />;
      case View.VendorManagement: return <VendorManagementView vendors={vendors} addVendor={addVendor} updateVendor={updateVendor} />;
      case View.CardManagement: return <CardManagementView cards={companyCards} transactions={cardTransactions} addCard={addCompanyCard} updateCard={updateCompanyCard} />;
        case View.ConsulCredits:
          return (
            <ConsulCreditsView
              config={consulCreditsConfig || mockConsulCreditsConfig} // Fallback to mock config
              supportedTokens={supportedTokens}
              transactions={consulCreditsTransactions}
              stats={consulCreditsStats}
              updateConfig={updateConsulCreditsConfig}
              onConnectWallet={handleConnectWallet}
              walletAddress={walletAddress}
              onSwitchNetwork={handleSwitchNetwork}
              onDeposit={handleDepositToken}
              onWithdraw={handleWithdrawToken}
              estimateGas={estimateTransactionGas}
              ensName={ensName}
              nativeETHBalance={nativeETHBalance}
            />
          );
      
      case View.StripePayments: return <StripePaymentsView 
        customers={stripeCustomers} 
        achPayments={achPayments} 
        directDepositPayouts={directDepositPayouts} 
      />;
      
      case View.StripeSettings: return <StripeSettingsView 
        customers={stripeCustomers} 
      />;
      
      case View.StripeCompliance: return <StripeComplianceView 
        complianceItems={complianceChecklist} 
        auditLogs={pciAuditLogs} 
        achReturns={achReturns} 
      />;
      
      case View.StripeReports: return <StripeReportsView 
        achPayments={achPayments} 
        directDepositPayouts={directDepositPayouts} 
        customers={stripeCustomers}
        // reconciliationEntries would be passed here if fetched
      />;
      
      case View.ISO20022: return <ISO20022View achPayments={achPayments} />;
      
      case View.Payroll: return <PayrollView employees={employees} addEmployee={addEmployee} updateEmployee={updateEmployee} addJournalEntry={addJournalEntry} />;
      case View.Settings: return <SettingsView 
        settings={settings} 
        setSettings={setSettings} 
        useMockData={useMockData} 
        setUseMockData={setUseMockData}
      />;
      default: return <DashboardView 
        journalEntries={journalEntries} 
        addJournalEntry={addJournalEntry} 
        purchaseOrders={purchaseOrders} 
        arInvoices={arInvoices} 
        apInvoices={apInvoices} 
        intercompanyPayableBalance={intercompanyPayableBalance}
        stripeCustomers={stripeCustomers}
        achPayments={achPayments}
        directDepositPayouts={directDepositPayouts}
        consulCreditsStats={consulCreditsStats}
      />;
    }
  };

  const currentViewName = useMemo(() => {
    const viewName = Object.keys(View).find(key => View[key as keyof typeof View] === activeView);
    return viewName ? viewName.replace(/([A-Z])/g, ' $1').trim() : 'Dashboard';
  }, [activeView]);

  return (
    <div className="flex bg-transparent text-sov-light min-h-screen">
      <Sidebar activeView={activeView} setActiveView={setActiveView} openTermsModal={() => setIsTermsModalOpen(true)} openManualModal={() => setIsManualModalOpen(true)} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <Header 
        currentViewName={activeView} 
        useMockData={useMockData}
        isConsoleOpen={isConsoleOpen}
        onMenuToggle={() => setIsMobileMenuOpen(true)}
        onToggleMockData={() => setUseMockData(!useMockData)}
        onToggleConsole={() => setIsConsoleOpen(prev => !prev)}
        isDemoMode={isDemoMode}
      />
      
      {/* NEW: Demo Mode Banner for Vercel / No Backend */}
      {isDemoMode && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center">
          <span className="text-yellow-400 text-sm font-medium">
            🎭 Demo Mode — Running with mock data (No backend connection)
          </span>
        </div>
      )}
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-3 sm:p-6">
          {error && <div className="bg-sov-red/20 text-sov-red p-3 sm:p-4 mb-4 rounded border border-sov-red/30 text-xs sm:text-sm font-bold tracking-tight">{error}</div>}
          <div key={activeView} className="animate-fade-in animate-slide-up">
            <ErrorBoundary>
              {renderView()}
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} title="Terms & Conditions" maxWidth="max-w-4xl">
        <div className="h-[75vh] overflow-y-auto custom-scrollbar">
          <TermsAndConditionsContent />
        </div>
      </Modal>
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Operational Blueprint" maxWidth="max-w-4xl">
        <div className="h-[75vh]">
          <UserManualContent />
        </div>
      </Modal>
      <SystemConsole 
        isOpen={isConsoleOpen} 
        onClose={() => setIsConsoleOpen(false)} 
        config={consulCreditsConfig}
        walletAddress={walletAddress}
      />
    </div>
  );
};

export default App;
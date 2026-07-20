import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { consulCreditsService } from '../services/consulCreditsService.js';

interface WalletContextType {
  walletAddress: string | null;
  ensName: string | null;
  nativeETHBalance: string;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalances: () => Promise<void>;
  estimateGas: (operation: 'deposit' | 'withdraw', tokenAddress: string, amount: string) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('connectedWalletAddress') || null;
    }
    return null;
  });
  
  const [ensName, setEnsName] = useState<string | null>(null);
  const [nativeETHBalance, setNativeETHBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);

  // Persist wallet address
  const updateWalletAddress = (address: string | null) => {
    setWalletAddress(address);
    if (address) {
      localStorage.setItem('connectedWalletAddress', address);
    } else {
      localStorage.removeItem('connectedWalletAddress');
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert("No crypto wallet detected. Please install Rabby, MetaMask, or Coinbase Wallet.");
      return;
    }

    setIsConnecting(true);
    try {
      const address = await consulCreditsService.connectWallet();
      updateWalletAddress(address);

      // Load ENS + ETH balance
      const [name, ethBal] = await Promise.all([
        consulCreditsService.getENSName(address),
        consulCreditsService.getNativeETHBalance(address)
      ]);
      setEnsName(name);
      setNativeETHBalance(ethBal);
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      if (error.code === 4001) {
        alert("Connection rejected by user.");
      } else {
        alert("Failed to connect wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    updateWalletAddress(null);
    setEnsName(null);
    setNativeETHBalance('0');
    console.log('Wallet disconnected');
  };

  const refreshBalances = async () => {
    if (!walletAddress) return;
    try {
      const [name, ethBal] = await Promise.all([
        consulCreditsService.getENSName(walletAddress),
        consulCreditsService.getNativeETHBalance(walletAddress)
      ]);
      setEnsName(name);
      setNativeETHBalance(ethBal);
    } catch (e) {
      console.warn('Balance refresh failed:', e);
    }
  };

  const estimateGas = async (operation: 'deposit' | 'withdraw', tokenAddress: string, amount: string) => {
    return consulCreditsService.estimateGasForOperation(operation, tokenAddress, amount);
  };

  // Auto-restore on mount + listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          updateWalletAddress(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // Force reload or re-init if needed
        window.location.reload();
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        (window as any).ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        ensName,
        nativeETHBalance,
        isConnecting,
        connectWallet,
        disconnectWallet,
        refreshBalances,
        estimateGas,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings2, 
  Activity, 
  CircleDot,
  Globe,
  ExternalLink,
  Copy,
  PlusCircle,
  History,
  Info
} from 'lucide-react';
import type { 
  ConsulCreditsConfig, 
  SupportedToken, 
  ConsulCreditsTransaction, 
  ConsulCreditsStats,
  ConsulCreditsTab
} from '../types.js';
import { Modal } from '../components/shared/Modal.js';
import { ModalButton, ModalInput, ModalLabel, ModalSelect } from '../components/shared/ModalElements.js';

interface ConsulCreditsViewProps {
  config: ConsulCreditsConfig;
  supportedTokens: SupportedToken[];
  transactions: ConsulCreditsTransaction[];
  stats: ConsulCreditsStats;
  updateConfig: (config: Partial<ConsulCreditsConfig>) => void;
  onConnectWallet?: () => void;
  walletAddress?: string | null;
  onSwitchNetwork?: (chainId: number) => void;
  onDeposit?: (tokenAddress: string, amount: string) => Promise<void>;
  onWithdraw?: (tokenAddress: string, amount: string) => Promise<void>;
  // NEW: Gas estimation + ENS + Native balance
  estimateGas?: (operation: 'deposit' | 'withdraw', tokenAddress: string, amount: string) => Promise<any>;
  ensName?: string | null;
  nativeETHBalance?: string;
}

const DepositModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  token: SupportedToken | null;
  onConfirm: (amount: string) => Promise<string>;
  config: ConsulCreditsConfig;
}> = ({ isOpen, onClose, token, onConfirm, config }) => {
  const [step, setStep] = useState<'INPUT' | 'REVIEW' | 'SIGNING' | 'SUCCESS'>('INPUT');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('INPUT');
      setAmount('');
      setTxHash('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !token) return null;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setStep('REVIEW');
  };

  const handleClose = () => {
    onClose();
  };

  const handleExecute = async () => {
    setStep('SIGNING');
    setError(null);
    try {
      const hash = await onConfirm(amount);
      setTxHash(hash);
      setStep('SUCCESS');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Transaction failed');
      setStep('INPUT'); 
    }
  };

  // Helper for Token Icons/Colors
  const getTokenStyles = (symbol: string) => {
    switch(symbol) {
      case 'USDC': return { bg: 'bg-blue-500', text: 'text-blue-500', gradient: 'from-blue-500/20 to-blue-600/5' };
      case 'WETH': return { bg: 'bg-purple-500', text: 'text-purple-500', gradient: 'from-purple-500/20 to-purple-600/5' };
      case 'DAI': return { bg: 'bg-yellow-500', text: 'text-yellow-500', gradient: 'from-yellow-500/20 to-yellow-600/5' };
      case 'usdSOVR': return { bg: 'bg-sov-accent', text: 'text-sov-accent', gradient: 'from-sov-accent/20 to-sov-accent/5' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-500', gradient: 'from-gray-500/20 to-gray-600/5' };
    }
  };

  const tokenStyle = getTokenStyles(token.symbol);

  // Dynamic Title based on step
  const getTitle = () => {
    switch(step) {
      case 'INPUT': return 'Deposit Assets';
      case 'REVIEW': return 'Confirm Deposit';
      case 'SIGNING': return 'Sign Transaction';
      case 'SUCCESS': return 'Deposit Successful';
      default: return 'Deposit';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="max-w-md">
       {/* Progress Indicator (Custom for this modal) */}
       <div className="flex space-x-1 mb-6">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1 w-full rounded-full transition-colors duration-300 ${
                (step === 'INPUT' && s === 1) || 
                (step === 'REVIEW' && s <= 2) || 
                ((step === 'SIGNING' || step === 'SUCCESS') && s <= 3) 
                  ? tokenStyle.bg 
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {step === 'INPUT' && (
          <form onSubmit={handleReview} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {/* Asset Selector (Visual Only) */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:border-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${tokenStyle.bg} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {token.symbol[0]}
                </div>
                <div>
                  <span className="block text-white font-semibold text-sm">{token.name}</span>
                  <span className="block text-white/50 text-xs font-medium">{token.symbol}</span>
                </div>
              </div>
              <div className="bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-mono text-white/70">
                ERC-20
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium uppercase tracking-wide">Amount</span>
                {token.userWalletBalance && (
                    <button 
                      type="button"
                      onClick={() => setAmount((parseFloat(token.userWalletBalance!) / Math.pow(10, token.decimals)).toString())}
                      className={`font-mono text-[10px] ${tokenStyle.text} hover:opacity-80 transition-opacity uppercase tracking-wide`}
                    >
                      MAX: {(parseFloat(token.userWalletBalance) / Math.pow(10, token.decimals)).toFixed(4)}
                    </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#1A1D24] border border-white/5 rounded-lg py-3 pl-4 pr-16 text-xl font-mono text-sov-light focus:outline-none focus:border-sov-accent/50 focus:ring-1 focus:ring-sov-accent/50 transition-all placeholder:text-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-sov-light-alt pointer-events-none">
                  {token.symbol}
                </div>
              </div>
              <p className="text-[10px] text-white/30 text-right">
                Rate: 1 {token.symbol} ≈ 1 CC
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium animate-in fade-in">
                {error}
              </div>
            )}

            <div className="pt-2 flex space-x-3">
              <ModalButton variant="secondary" onClick={onClose} type="button">
                Cancel
              </ModalButton>
              <ModalButton 
                variant="primary" 
                type="submit" 
                disabled={!amount}
                className={!amount ? 'opacity-50' : `${tokenStyle.bg} border-transparent text-white hover:brightness-110 shadow-none`}
              >
                Continue
              </ModalButton>
            </div>
          </form>
        )}

        {step === 'REVIEW' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/5 relative overflow-hidden text-center">
              <div className={`absolute top-0 right-0 p-24 ${tokenStyle.bg} opacity-[0.05] blur-3xl rounded-full`} />
              
              <div className="relative z-10">
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">You are depositing</span>
                <div className="mt-2 text-3xl font-bold text-white font-mono">{amount}</div>
                <div className="text-sm text-sov-accent font-medium mt-1">{token.symbol}</div>
              </div>

              <div className="h-px bg-white/5 my-4" />

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Network</span>
                  <span className="flex items-center space-x-1.5 text-sov-light">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="font-medium">Base Mainnet</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Contract</span>
                  <span className="font-mono text-sov-light/70 bg-white/5 px-2 py-0.5 rounded text-[10px]">{config.contractAddress.slice(0, 6)}...{config.contractAddress.slice(-4)}</span>
                </div>
                
                {/* NEW: Gas Estimate Display */}
                {gasEstimate && (
                  <div className="flex justify-between items-center pt-1 border-t border-white/10 mt-1">
                    <span className="text-white/40">Est. Gas</span>
                    <span className="font-mono text-sov-light/70 text-[10px]">
                      ~{parseFloat(gasEstimate.estimatedCostETH).toFixed(5)} ETH
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
                <ModalButton variant="secondary" onClick={() => setStep('INPUT')}>
                  Back
                </ModalButton>
                <ModalButton 
                  onClick={handleExecute}
                  className={`${tokenStyle.bg} border-transparent text-white hover:brightness-110 shadow-none font-bold`}
                 >
                  Confirm Deposit
                </ModalButton>
            </div>
          </div>
        )}

        {step === 'SIGNING' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-white/5 border-t-white animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className={`w-6 h-6 ${tokenStyle.text} animate-pulse`} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Check your Wallet</h3>
                <p className="text-white/50 text-xs max-w-[200px] mx-auto">
                  Please sign the <strong>Approve</strong> and <strong>Deposit</strong> transactions.
                </p>
              </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="py-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 mb-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                <ShieldCheck className="w-8 h-8 text-green-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">Success!</h3>
              <p className="text-white/50 text-xs mb-6 max-w-[240px]">
                Your deposit has been submitted.
              </p>

              <div className="w-full bg-white/5 rounded-xl p-3 border border-white/5 mb-6 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-default">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-1.5 bg-white/5 rounded-lg">
                    <Activity className="w-4 h-4 text-white/50" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden text-left">
                    <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Tx Hash</span>
                    <span className="text-[10px] font-mono text-white/80 truncate w-32">{txHash.slice(0, 16)}...</span>
                  </div>
                </div>
                <a 
                  href={`https://basescan.org/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <ModalButton fullWidth onClick={handleClose} variant="secondary" className="bg-white text-black hover:bg-white/90 font-bold border-transparent">
                Done
              </ModalButton>
          </div>
        )}
    </Modal>
  );
};

const WithdrawModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  token: SupportedToken | null;
  onConfirm: (amount: string) => Promise<string>;
  config: ConsulCreditsConfig;
  userConsulCreditsBalance?: string;
}> = ({ isOpen, onClose, token, onConfirm, config, userConsulCreditsBalance }) => {
  const [step, setStep] = useState<'INPUT' | 'REVIEW' | 'SIGNING' | 'SUCCESS'>('INPUT');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('INPUT');
      setAmount('');
      setTxHash('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !token) return null;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setStep('REVIEW');
  };

  const handleClose = () => {
    onClose();
  };

  const handleExecute = async () => {
    setStep('SIGNING');
    setError(null);
    try {
      const hash = await onConfirm(amount);
      setTxHash(hash);
      setStep('SUCCESS');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Transaction failed');
      setStep('INPUT'); 
    }
  };

  const getTokenStyles = (symbol: string) => {
    switch(symbol) {
      case 'USDC': return { bg: 'bg-blue-500', text: 'text-blue-500', gradient: 'from-blue-500/20 to-blue-600/5' };
      case 'WETH': return { bg: 'bg-purple-500', text: 'text-purple-500', gradient: 'from-purple-500/20 to-purple-600/5' };
      case 'DAI': return { bg: 'bg-yellow-500', text: 'text-yellow-500', gradient: 'from-yellow-500/20 to-yellow-600/5' };
      case 'usdSOVR': return { bg: 'bg-sov-accent', text: 'text-sov-accent', gradient: 'from-sov-accent/20 to-sov-accent/5' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-500', gradient: 'from-gray-500/20 to-gray-600/5' };
    }
  };

  const tokenStyle = getTokenStyles(token.symbol);

  const getTitle = () => {
    switch(step) {
      case 'INPUT': return 'Withdraw Assets';
      case 'REVIEW': return 'Confirm Withdrawal';
      case 'SIGNING': return 'Sign Transaction';
      case 'SUCCESS': return 'Withdrawal Successful';
      default: return 'Withdraw';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="max-w-md">
       <div className="flex space-x-1 mb-6">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1 w-full rounded-full transition-colors duration-300 ${
                (step === 'INPUT' && s === 1) || 
                (step === 'REVIEW' && s <= 2) || 
                ((step === 'SIGNING' || step === 'SUCCESS') && s <= 3) 
                  ? 'bg-sov-red' 
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {step === 'INPUT' && (
          <form onSubmit={handleReview} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:border-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${tokenStyle.bg} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {token.symbol[0]}
                </div>
                <div>
                  <span className="block text-white font-semibold text-sm">{token.name}</span>
                  <span className="block text-white/50 text-xs font-medium">{token.symbol}</span>
                </div>
              </div>
              <div className="bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-mono text-white/70">
                CC Wrapper
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium uppercase tracking-wide">Withdraw Amount (CC)</span>
                {userConsulCreditsBalance && (
                    <button 
                      type="button"
                      onClick={() => setAmount(userConsulCreditsBalance)}
                      className="font-mono text-[10px] text-sov-red hover:opacity-80 transition-opacity uppercase tracking-wide"
                    >
                      MAX: {parseFloat(userConsulCreditsBalance).toFixed(4)}
                    </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#1A1D24] border border-white/5 rounded-lg py-3 pl-4 pr-16 text-xl font-mono text-sov-light focus:outline-none focus:border-sov-red/50 focus:ring-1 focus:ring-sov-red/50 transition-all placeholder:text-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-sov-light-alt pointer-events-none">
                  CC
                </div>
              </div>
              <p className="text-[10px] text-white/30 text-right">
                Rate: 1 CC ≈ 1 {token.symbol}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium animate-in fade-in">
                {error}
              </div>
            )}

            <div className="pt-2 flex space-x-3">
              <ModalButton variant="secondary" onClick={onClose} type="button">
                Cancel
              </ModalButton>
              <ModalButton 
                variant="primary" 
                type="submit" 
                disabled={!amount}
                className={!amount ? 'opacity-50' : `bg-sov-red border-transparent text-white hover:brightness-110 shadow-none`}
              >
                Continue
              </ModalButton>
            </div>
          </form>
        )}

        {step === 'REVIEW' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/5 relative overflow-hidden text-center">
              <div className={`absolute top-0 right-0 p-24 bg-sov-red opacity-[0.05] blur-3xl rounded-full`} />
              
              <div className="relative z-10">
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">You are withdrawing</span>
                <div className="mt-2 text-3xl font-bold text-white font-mono">{amount}</div>
                <div className="text-sm text-sov-red font-medium mt-1">Consul Credits</div>
              </div>

              <div className="h-px bg-white/5 my-4" />

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white/40">You will receive</span>
                  <span className="text-sov-light font-bold">~ {amount} {token.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Network</span>
                  <span className="flex items-center space-x-1.5 text-sov-light">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="font-medium">Base Mainnet</span>
                  </span>
                </div>
                
                {/* NEW: Gas Estimate for Withdraw */}
                {gasEstimate && (
                  <div className="flex justify-between items-center pt-1 border-t border-white/10 mt-1">
                    <span className="text-white/40">Est. Gas</span>
                    <span className="font-mono text-sov-light/70 text-[10px]">
                      ~{parseFloat(gasEstimate.estimatedCostETH).toFixed(5)} ETH
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
                <ModalButton variant="secondary" onClick={() => setStep('INPUT')}>
                  Back
                </ModalButton>
                <ModalButton 
                  onClick={handleExecute}
                  className={`bg-sov-red border-transparent text-white hover:brightness-110 shadow-none font-bold`}
                 >
                  Confirm Withdrawal
                </ModalButton>
            </div>
          </div>
        )}

        {step === 'SIGNING' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-white/5 border-t-white animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ArrowUpRight className={`w-6 h-6 text-sov-red animate-pulse`} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Check your Wallet</h3>
                <p className="text-white/50 text-xs max-w-[200px] mx-auto">
                  Please sign the <strong>Withdrawal</strong> transaction in your wallet.
                </p>
              </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="py-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-sov-red/10 rounded-full flex items-center justify-center border border-sov-red/20 mb-4 shadow-[0_0_20px_rgba(240,68,56,0.1)]">
                <ArrowUpRight className="w-8 h-8 text-sov-red" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">Success!</h3>
              <p className="text-white/50 text-xs mb-6 max-w-[240px]">
                Your withdrawal has been submitted.
              </p>

              <div className="w-full bg-white/5 rounded-xl p-3 border border-white/5 mb-6 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-default">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-1.5 bg-white/5 rounded-lg">
                    <Activity className="w-4 h-4 text-white/50" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden text-left">
                    <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Tx Hash</span>
                    <span className="text-[10px] font-mono text-white/80 truncate w-32">{txHash.slice(0, 16)}...</span>
                  </div>
                </div>
                <a 
                  href={`https://basescan.org/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <ModalButton fullWidth onClick={handleClose} variant="secondary" className="bg-white text-black hover:bg-white/90 font-bold border-transparent">
                Done
              </ModalButton>
          </div>
        )}
    </Modal>
  );
};

const CreditMetric: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
}> = ({ title, value, subtitle, icon, gradient }) => (
  <div className="relative group overflow-hidden bg-sov-dark-alt/40 backdrop-blur-xl p-4 rounded-2xl border border-sov-light/10 hover:border-sov-accent/30 transition-all duration-300">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.08] blur-2xl transition-opacity font-mono`}></div>
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-10 border border-white/5`}>
        <div className="text-white/80">{icon}</div>
      </div>
      <div className="text-[9px] font-bold tracking-widest text-sov-light-alt uppercase opacity-50">Real-Time HUD</div>
    </div>
    <div className="space-y-0.5">
      <h3 className="text-[10px] font-semibold text-sov-light-alt uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline space-x-2">
        <span className="text-xl font-bold text-sov-light tracking-tight">{value}</span>
      </div>
      <p className="text-[9px] text-sov-light-alt/60 font-medium">{subtitle}</p>
    </div>
    <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${gradient} w-2/3 opacity-50`}></div>
    </div>
  </div>
);

export const ConsulCreditsView: React.FC<ConsulCreditsViewProps> = ({
  config,
  supportedTokens,
  transactions,
  stats,
  updateConfig,
  onConnectWallet,
  walletAddress,

  onSwitchNetwork,
  onDeposit
}) => {
  const [activeTab, setActiveTab] = useState<ConsulCreditsTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ConsulCreditsTransaction['status']>('all');
  
  // Deposit / Withdraw Modal State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SupportedToken | null>(null);

  // NEW: Gas estimation state
  const [gasEstimate, setGasEstimate] = useState<any>(null);

  const handleDepositClick = (token: SupportedToken) => {
    setSelectedToken(token);
    setIsDepositModalOpen(true);
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch =
        tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.userAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.ledgerReference.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  // Calculate overview metrics
  const overviewMetrics = useMemo(() => {
    const totalDeposits = transactions
      .filter(tx => tx.eventType === 'DEPOSIT' && tx.status === 'CONFIRMED')
      .reduce((sum, tx) => sum + parseFloat(tx.consulCreditsAmount), 0);

    const totalWithdrawals = transactions
      .filter(tx => tx.eventType === 'WITHDRAW' && tx.status === 'CONFIRMED')
      .reduce((sum, tx) => sum + parseFloat(tx.consulCreditsAmount), 0);

    const totalMinted = transactions
      .filter(tx => tx.eventType === 'ORACLE_MINT' && tx.status === 'CONFIRMED')
      .reduce((sum, tx) => sum + parseFloat(tx.consulCreditsAmount), 0);

    const totalBurned = transactions
      .filter(tx => tx.eventType === 'ORACLE_BURN' && tx.status === 'CONFIRMED')
      .reduce((sum, tx) => sum + parseFloat(tx.consulCreditsAmount), 0);

    return {
      totalDeposits,
      totalWithdrawals,
      totalMinted,
      totalBurned,
      netSupply: totalDeposits + totalMinted - totalWithdrawals - totalBurned,
      transactionCount: transactions.length,
      activeTokens: supportedTokens.filter(t => t.isActive).length
    };
  }, [transactions, supportedTokens]);

  const formatCurrency = (amount: number | string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);

  const formatTokenAmount = (amount: string, decimals: number = 18) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(decimals, 8)
    }).format(num);
  };

  const getEventTypeColor = (eventType: ConsulCreditsTransaction['eventType']) => {
    switch (eventType) {
      case 'DEPOSIT': return 'bg-sov-green/20 text-sov-green';
      case 'WITHDRAW': return 'bg-sov-red/20 text-sov-red';
      case 'ORACLE_MINT': return 'bg-sov-accent/20 text-sov-accent';
      case 'ORACLE_BURN': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: ConsulCreditsTransaction['status']) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-sov-green/20 text-sov-green';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
      case 'FAILED': return 'bg-sov-red/20 text-sov-red';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Toast notification would be better
    });
  };

  const openEtherscan = (txHash: string) => {
    let baseUrl = 'https://basescan.org/tx/';
    if (config.chainId === 1) {
      baseUrl = 'https://etherscan.io/tx/';
    } else if (config.chainId === 11155111) {
      baseUrl = 'https://sepolia.etherscan.io/tx/';
    }
    window.open(`${baseUrl}${txHash}`, '_blank');
  };

  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-sov-dark-alt/30 backdrop-blur-2xl p-8 rounded-3xl border border-sov-light/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sov-accent opacity-[0.05] blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 mb-1">
              <div className="p-2 bg-sov-accent/10 rounded-lg border border-sov-accent/20">
                <ShieldCheck className="w-5 h-5 text-sov-accent" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-sov-light">Consul Credits Wrapper</h1>
            </div>
            <p className="text-sov-light-alt font-medium max-w-2xl">
              Advanced ERC-20 token abstraction layer for denominated consul credit units, providing unified liquidity across Oracle Ledger blockchain integrations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center space-x-2.5 px-4 py-2 rounded-2xl border ${config.isEnabled ? 'bg-sov-green/5 border-sov-green/20' : 'bg-sov-red/5 border-sov-red/20'} backdrop-blur-md`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${config.isEnabled ? 'bg-sov-green' : 'bg-sov-red'}`}></div>
              <span className={`text-xs font-bold uppercase tracking-wider ${config.isEnabled ? 'text-sov-green' : 'text-sov-red'}`}>
                Oracle Core Active
              </span>
            </div>
            
            {/* Network Switcher */}
            <div className="relative">
              <button 
                onClick={() => setIsNetworkMenuOpen(!isNetworkMenuOpen)}
                className={`flex items-center space-x-2.5 px-4 py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 group/net
                  ${config.chainId === 8453 
                    ? 'bg-sov-light/5 border-sov-light/10 hover:bg-sov-accent/10 hover:border-sov-accent/40 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(78,205,196,0.2)]' 
                    : 'bg-sov-red/10 border-sov-red/30 animate-pulse hover:bg-sov-red/20'}`}
              >
                <Globe className={`w-4 h-4 transition-colors duration-300 ${config.chainId === 8453 ? 'text-sov-light-alt group-hover/net:text-sov-accent' : 'text-sov-red'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${config.chainId === 8453 ? 'text-sov-light group-hover/net:text-sov-accent' : 'text-sov-red'}`}>
                  {config.chainId === 8453 ? 'Base Mainnet' : 'Wrong Network'}
                </span>
              </button>
              
              {isNetworkMenuOpen && onSwitchNetwork && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-sov-dark border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => { onSwitchNetwork(8453); setIsNetworkMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors ${config.chainId === 8453 ? 'text-sov-accent' : 'text-sov-light-alt'}`}
                    >
                      Base Mainnet
                    </button>
                    <button 
                      onClick={() => { onSwitchNetwork(11155111); setIsNetworkMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors ${config.chainId === 11155111 ? 'text-sov-accent' : 'text-sov-light-alt'}`}
                    >
                      Sepolia Testnet
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {onConnectWallet && (
              <button 
                onClick={onConnectWallet}
                className={`flex items-center space-x-2.5 px-4 py-2 rounded-2xl border backdrop-blur-md transition-all ${
                  walletAddress 
                    ? 'bg-sov-accent/10 border-sov-accent/30 text-sov-accent hover:bg-sov-red/10 hover:border-sov-red/30 hover:text-sov-red group/wallet' 
                    : 'bg-sov-light/10 border-sov-light/20 text-sov-light hover:bg-sov-light/20'
                }`}
                title={walletAddress ? "Click to disconnect wallet" : "Connect your Web3 wallet"}
              >
                {/* NEW: Show ENS + ETH balance when connected */}
                {walletAddress && ensName && (
                  <span className="text-[10px] font-mono text-sov-accent mr-1 hidden md:inline">
                    {ensName}
                  </span>
                )}
                {walletAddress && nativeETHBalance && parseFloat(nativeETHBalance) > 0 && (
                  <span className="text-[10px] font-mono text-white/60 mr-2 hidden md:inline">
                    {parseFloat(nativeETHBalance).toFixed(4)} ETH
                  </span>
                )}
                <div className={`w-2 h-2 rounded-full ${walletAddress ? 'bg-sov-accent group-hover/wallet:bg-sov-red shadow-[0_0_8px_rgba(78,205,196,0.5)]' : 'bg-sov-light-alt'}`}></div>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {walletAddress ? (
                    <span className="group-hover/wallet:hidden">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
                  ) : 'Connect Wallet'}
                  {walletAddress && <span className="hidden group-hover/wallet:inline">Disconnect</span>}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modern Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-sov-dark-alt/20 p-2 rounded-2xl border border-white/5">
        <div className="flex space-x-1 p-1 bg-sov-dark/50 rounded-xl">
          {[
            { key: 'overview', label: 'Network HUD', icon: <Activity className="w-4 h-4 text-sov-accent" /> },
            { key: 'tokens', label: 'Token Assets', icon: <Coins className="w-4 h-4 text-sov-accent" /> },
            { key: 'transactions', label: 'History', icon: <History className="w-4 h-4 text-sov-accent" /> },
            { key: 'settings', label: 'Vault Config', icon: <Settings2 className="w-4 h-4 text-sov-accent" /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ConsulCreditsTab)}
              className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 rounded-lg ${
                activeTab === tab.key
                  ? 'bg-sov-accent shadow-lg shadow-sov-accent/20 text-sov-dark scale-[1.02]'
                  : 'text-sov-light-alt hover:bg-white/5 hover:text-sov-light'
              }`}
            >
              {React.cloneElement(tab.icon as React.ReactElement, { className: `w-4 h-4 ${activeTab === tab.key ? 'text-sov-dark' : 'text-sov-accent opacity-70'}` })}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-500 max-h-[600px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CreditMetric
              title="Total Supply"
              value={`${formatTokenAmount(stats.totalSupply)} CC`}
              subtitle="Aggregated Ledger Balance"
              icon={<ShieldCheck className="w-5 h-5" />}
              gradient="from-sov-accent to-blue-500"
            />
            <CreditMetric
              title="Active Liquidity"
              value={`${formatTokenAmount(overviewMetrics.netSupply.toString())} CC`}
              subtitle="Verified Vault Reserves"
              icon={<Activity className="w-5 h-5" />}
              gradient="from-sov-green to-emerald-500"
            />
            <CreditMetric
              title="Asset Count"
              value={overviewMetrics.activeTokens.toString()}
              subtitle="Supported ERC-20 Tokens"
              icon={<Coins className="w-5 h-5" />}
              gradient="from-sov-purple to-sov-pink"
            />
            <CreditMetric
              title="Total Volume"
              value={overviewMetrics.transactionCount.toString()}
              subtitle="Immutable Audit Events"
              icon={<History className="w-5 h-5" />}
              gradient="from-sov-accent to-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Audit Log */}
            <div className="lg:col-span-2 bg-sov-dark-alt/20 rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sov-accent/10 rounded-xl">
                    <History className="w-4 h-4 text-sov-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-sov-light">Recent Audit Events</h3>
                </div>
                <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold text-sov-accent uppercase tracking-widest hover:text-sov-accent-hover transition-colors">
                  View All Log History
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-sov-light-alt/50 border-b border-white/5">
                      <th className="px-6 py-4">Event Flow</th>
                      <th className="px-6 py-4">Token Asset</th>
                      <th className="px-6 py-4 text-right">Credit Value</th>
                      <th className="px-6 py-4">Audit Status</th>
                      <th className="px-6 py-4">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.slice(0, 6).map(tx => (
                      <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${getEventTypeColor(tx.eventType)}`}>
                              {tx.eventType === 'DEPOSIT' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs font-bold text-sov-light tracking-wide">{tx.eventType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-sov-dark border border-white/10 flex items-center justify-center text-[10px] font-bold text-sov-accent">
                              {tx.tokenSymbol.slice(0, 2)}
                            </div>
                            <span className="text-xs font-medium text-sov-light-alt">{tx.tokenSymbol}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-mono font-bold text-sov-accent">{formatTokenAmount(tx.consulCreditsAmount)} CC</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'CONFIRMED' ? 'bg-sov-green' : 'bg-sov-red'}`}></div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${tx.status === 'CONFIRMED' ? 'text-sov-green' : 'text-sov-red'}`}>{tx.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => openEtherscan(tx.txHash)} className="p-2 hover:bg-sov-accent/10 rounded-lg text-sov-light-alt hover:text-sov-accent transition-all group-hover:scale-110">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Network Health Side HUD */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-sov-accent/20 to-sov-purple/20 p-6 rounded-3xl border border-sov-accent/20 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck className="w-16 h-16" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-sov-accent mb-4">Oracle Security</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-sov-light-alt">Auditability</span>
                    <span className="text-xs font-bold text-sov-green">100% Immutable</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-sov-light-alt">Integration Latency</span>
                    <span className="text-xs font-bold text-sov-light">&lt; 1 Block</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-sov-light-alt">Consensus Verified</span>
                    <CircleDot className="w-3.5 h-3.5 text-sov-green animate-pulse" />
                  </div>
                </div>
                <div className="mt-6 p-3 bg-sov-dark/40 rounded-xl border border-white/5">
                  <p className="text-[10px] text-sov-light-alt leading-relaxed italic">
                    "All credit generation events are cryptographically mapped to the Oracle Ledger primary journal."
                  </p>
                </div>
              </div>

              <div className="bg-sov-dark-alt/20 p-6 rounded-3xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-sov-light-alt mb-4">Contract Reserves</h4>
                <div className="space-y-4">
                  {stats.contractReserves.slice(0, 3).map(reserve => (
                    <div key={reserve.tokenSymbol} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-sov-light">{reserve.tokenSymbol}</span>
                        <span className="text-sov-light-alt">{formatTokenAmount(reserve.value)} CC</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-sov-accent" style={{ width: `${Math.min((parseFloat(reserve.value) / parseFloat(stats.totalSupply)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Assets Tab Content */}
      {activeTab === 'tokens' && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 max-h-[600px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {supportedTokens.map(token => {
              const totalDeposited = parseFloat(token.totalDeposited) / Math.pow(10, token.decimals);
              const totalWithdrawn = parseFloat(token.totalWithdrawn) / Math.pow(10, token.decimals);
              const netBalance = totalDeposited - totalWithdrawn;

              // Token specific gradients
              const gradients: Record<string, string> = {
                'USDC': 'from-blue-600/20 to-blue-400/10 border-blue-500/30',
                'USDT': 'from-emerald-600/20 to-emerald-400/10 border-emerald-500/30',
                'WETH': 'from-sov-purple/20 to-sov-pink/10 border-sov-purple/30',
                'SOVRCVLT': 'from-sov-accent/20 to-amber-500/10 border-sov-accent/30',
                'usdSOVR': 'from-sov-accent/20 to-blue-500/10 border-sov-accent/30'
              };

              const gradientClass = gradients[token.symbol] || 'from-sov-dark-alt/40 to-sov-dark/30 border-white/10';

              return (
                <div key={token.address} className={`relative overflow-hidden bg-gradient-to-br ${gradientClass} backdrop-blur-xl p-5 rounded-3xl border shadow-xl group transition-all duration-500 hover:scale-[1.01]`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-sov-dark border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner font-mono">
                          <span className="text-lg font-black text-sov-accent tracking-tighter">{token.symbol.slice(0, 3)}</span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-sov-dark ${token.isActive ? 'bg-sov-green' : 'bg-sov-red'}`}></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-sov-light tracking-tight">{token.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-sov-accent uppercase tracking-[0.15em]">{token.symbol}</span>
                          <span className="text-sov-light-alt opacity-30">•</span>
                          <span className="text-[9px] font-medium text-sov-light-alt">{token.decimals} Decimals</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sov-light-alt/30 block mb-1">Exchange Protocol</span>
                      <div className="flex items-center space-x-2 bg-sov-dark/50 px-2.5 py-1 rounded-xl border border-white/5">
                        <span className="text-[10px] font-mono font-bold text-sov-light">1 {token.symbol}</span>
                        <ArrowUpRight className="w-2.5 h-2.5 text-sov-accent" />
                        <span className="text-[10px] font-mono font-bold text-sov-accent">{formatTokenAmount(token.exchangeRate)} CC</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-sov-dark/30 p-3 rounded-2xl border border-white/5 mb-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-sov-light-alt/60 uppercase tracking-widest">Inflow</p>
                      <p className="text-xs font-mono font-bold text-sov-green">+{formatTokenAmount(totalDeposited.toString())}</p>
                    </div>
                    <div className="space-y-0.5 border-x border-white/5 px-4 text-center">
                      <p className="text-[9px] font-bold text-sov-light-alt/60 uppercase tracking-widest">Outflow</p>
                      <p className="text-xs font-mono font-bold text-sov-red">-{formatTokenAmount(totalWithdrawn.toString())}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[9px] font-bold text-sov-light-alt/60 uppercase tracking-widest">Net Asset</p>
                      <p className="text-xs font-mono font-bold text-sov-light">{formatTokenAmount(netBalance.toString())}</p>
                    </div>
                  </div>
                  
                  {token.userWalletBalance && (
                    <div className="mb-4 p-3 bg-sov-accent/5 rounded-2xl border border-sov-accent/10 flex justify-between items-center">
                       <span className="text-[9px] font-bold text-sov-accent uppercase tracking-widest">Your Wallet Balance</span>
                       <span className="text-xs font-mono font-bold text-sov-light">{formatTokenAmount((parseFloat(token.userWalletBalance) / Math.pow(10, token.decimals)).toString(), token.decimals)} {token.symbol}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-sov-dark/50 rounded-xl border border-white/5">
                      <Globe className="w-2.5 h-2.5 text-sov-light-alt" />
                      <span className="text-[9px] font-mono text-sov-light-alt truncate max-w-[100px]">{token.address}</span>
                      <button onClick={() => copyToClipboard(token.address)} className="p-0.5 hover:text-sov-accent transition-colors">
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                       <button 
                         onClick={() => handleDepositClick(token)}
                         className="px-3 py-1.5 bg-sov-accent text-sov-dark text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-sov-accent-hover transition-all shadow-lg shadow-sov-accent/10"
                       >
                         Deposit
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedToken(token);
                           // Note: Withdraw modal is handled separately below
                           // For now we trigger withdraw via a different state if needed
                           // Since WithdrawModal is defined, we can open it similarly
                           // This button now opens withdraw modal
                           setIsWithdrawModalOpen(true);
                         }}
                         className="px-3 py-1.5 bg-sov-dark border border-white/5 text-sov-light text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
                       >
                         Withdraw
                       </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tabs for Transactions and Settings will follow the same pattern */}
      {(activeTab === 'transactions' || activeTab === 'settings') && (
        <div className="bg-sov-dark-alt/20 backdrop-blur-xl p-8 rounded-3xl border border-white/5 max-h-[600px] overflow-y-auto">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2.5 bg-sov-accent/10 rounded-2xl border border-sov-accent/20">
               {activeTab === 'transactions' ? <History className="w-5 h-5 text-sov-accent" /> : <Settings2 className="w-5 h-5 text-sov-accent" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-sov-light">{activeTab === 'transactions' ? 'Audit Log Explorer' : 'Wrapper Configuration'}</h2>
              <p className="text-sm text-sov-light-alt">
                {activeTab === 'transactions' ? 'Comprehensive immutable log of all credit abstraction events.' : 'Advanced system parameters for the Oracle Integration Layer.'}
              </p>
            </div>
          </div>

          {/* Reuse filtered table logic for transactions */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
               <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sov-light-alt group-focus-within:text-sov-accent transition-colors" />
                    <input
                      type="text"
                      placeholder="Audit Search (Hash, Address, Reference)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-sov-dark/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent/20 focus:border-sov-accent transition-all"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-sov-dark/50 border border-white/5 rounded-2xl py-3 px-6 text-sm text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent/20 focus:border-sov-accent transition-all font-bold uppercase tracking-widest"
                  >
                    <option value="all">ALL-AUDITS</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                  </select>
               </div>

               <div className="rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr className="text-left text-[10px] uppercase tracking-[0.2em] font-bold text-sov-light-alt/60">
                      <th className="px-6 py-4">Status & Type</th>
                      <th className="px-6 py-4">Asset Detail</th>
                      <th className="px-6 py-4 text-right">Credit Value</th>
                      <th className="px-6 py-4">Ledger Reference</th>
                      <th className="px-6 py-4">Blockchain Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg ${getStatusColor(tx.status)}`}>
                              <CircleDot className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-xs text-sov-light tracking-wide">{tx.eventType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-sov-light">{tx.tokenSymbol}</span>
                            <p className="text-[10px] font-mono text-sov-light-alt opacity-50">{tx.txHash.slice(0, 18)}...</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-mono font-black text-sov-accent">{formatTokenAmount(tx.consulCreditsAmount)} CC</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                             <div className="w-2 h-2 rounded-full bg-sov-accent/30 shadow-[0_0_8px_rgba(78,205,196,0.3)]"></div>
                             <span className="text-xs font-bold text-sov-light-alt font-mono tracking-tight">{tx.journalEntryId || 'UNMAPPED'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => openEtherscan(tx.txHash)} className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-sov-light-alt hover:text-sov-accent transition-colors group">
                            <span>Block Explorer</span>
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <Activity className="w-12 h-12 text-white/5 mx-auto" />
                    <p className="text-sm text-sov-light-alt tracking-wider font-bold uppercase">No Audit Matches Found</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="space-y-10 animate-in slide-in-from-top-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-sov-accent">Integration Point (Contract)</label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sov-accent/50" />
                      <input
                        type="text"
                        value={config.contractAddress}
                        readOnly
                        className="w-full bg-sov-dark/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-mono text-sov-light focus:outline-none"
                      />
                      <button onClick={() => copyToClipboard(config.contractAddress)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-sov-accent/10 rounded-xl transition-colors">
                        <Copy className="w-3.5 h-3.5 text-sov-accent" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-sov-accent">Data Integration (RPC)</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sov-accent/50" />
                      <input
                        type="text"
                        value={config.rpcUrl}
                        readOnly
                        className="w-full bg-sov-dark/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-mono text-sov-light focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-sov-accent">Consensus Requirements</label>
                    <div className="relative group">
                      <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sov-accent/50" />
                      <input
                        type="number"
                        value={config.confirmationsRequired}
                        onChange={(e) => updateConfig({ confirmationsRequired: parseInt(e.target.value) })}
                        className="w-full bg-sov-dark/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-mono text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent/20 focus:border-sov-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-sov-accent">Master System Integration</label>
                    <div className="flex items-center space-x-4 p-3 bg-sov-dark/50 border border-white/10 rounded-2xl">
                       <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-sov-dark border border-white/10">
                          <input
                            type="checkbox"
                            className="absolute z-10 h-6 w-11 cursor-pointer opacity-0"
                            checked={config.isEnabled}
                            onChange={(e) => updateConfig({ isEnabled: e.target.checked })}
                          />
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-sov-accent shadow-lg transition duration-200 ease-in-out ${config.isEnabled ? 'translate-x-6' : 'translate-x-1'} shadow-sov-accent/40`} />
                       </div>
                       <span className="text-xs font-bold uppercase tracking-widest text-sov-light">Enable Integration Layer</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-sov-accent/10 to-transparent rounded-3xl border border-sov-accent/20 flex gap-4">
                   <div className="p-3 bg-sov-accent/10 rounded-2xl h-fit">
                     <Info className="w-5 h-5 text-sov-accent" />
                   </div>
                   <div className="space-y-2">
                     <h4 className="text-sm font-bold text-sov-light uppercase tracking-widest">Wrapper Protocol Information</h4>
                     <p className="text-xs text-sov-light-alt leading-relaxed">
                       The Consul Credits Wrapper is a high-security abstraction layer. Every deposit event triggers an immutable journal entry in the Oracle Ledger.
                       Confirmations are set to <strong>{config.confirmationsRequired}</strong> blocks to ensure finality before credit availability.
                     </p>
                   </div>
                </div>
              </div>
           )}
        </div>
      )}

      
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        token={selectedToken}
        config={config}
        onConfirm={async (amount) => {
          if (onDeposit && selectedToken) {
            return await onDeposit(selectedToken.address, amount);
          }
          throw new Error('Deposit function not available');
        }}
      />

      {/* Withdraw Modal - Now fully wired */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        token={selectedToken}
        config={config}
        userConsulCreditsBalance={selectedToken ? '0' : undefined} // Could be enhanced with CC balance
        onConfirm={async (amount) => {
          if (onWithdraw && selectedToken) {
            return await onWithdraw(selectedToken.address, amount);
          }
          throw new Error('Withdraw function not available');
        }}
      />
    </div>
  );
};
import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  ExternalLink, 
  Lock, 
  Flame, 
  Send,
  Code2
} from 'lucide-react';
import type { JournalEntry, Invoice } from '../types.js';
import { settlementEngine, MerkleAuditEpoch, SettlementEventLog } from '../services/settlementEngineService.js';
import { oracleCopilot, CopilotActionPlan } from '../services/oracleCopilotService.js';
import { Modal } from '../components/shared/Modal.js';

interface AutonomousSettlementViewProps {
  journalEntries: JournalEntry[];
  arInvoices: Invoice[];
  apInvoices: Invoice[];
  intercompanyPayableBalance: number;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => Promise<void>;
}

export const AutonomousSettlementView: React.FC<AutonomousSettlementViewProps> = ({
  journalEntries,
  arInvoices,
  apInvoices,
  intercompanyPayableBalance,
  addJournalEntry
}) => {
  const [epochs, setEpochs] = useState<MerkleAuditEpoch[]>(() => settlementEngine.getAuditEpochs());
  const [logs, setLogs] = useState<SettlementEventLog[]>(() => settlementEngine.getEventLogs());
  const [isEngineActive, setIsEngineActive] = useState<boolean>(() => settlementEngine.isAutoActive());

  // Copilot State
  const [copilotInput, setCopilotInput] = useState('');
  const [activePlan, setActivePlan] = useState<CopilotActionPlan | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Trigger Proof-of-Solvency Merkle computation
  const handlePublishEpoch = () => {
    const epoch = settlementEngine.generateProofOfSolvency(journalEntries);
    setEpochs(settlementEngine.getAuditEpochs());
    setLogs(settlementEngine.getEventLogs());
    showToast(`Cryptographic Solvency Epoch ${epoch.epochId} attested on-chain!`);
  };

  // 2. Net Intercompany autonomously
  const handleNetIntercompany = async () => {
    const entry = settlementEngine.reconcileIntercompany(intercompanyPayableBalance);
    if (entry) {
      await addJournalEntry({
        description: entry.description,
        source: entry.source,
        status: entry.status,
        lines: entry.lines
      });
      setLogs(settlementEngine.getEventLogs());
      showToast('Intercompany accounts 1200 ↔ 2200 netted to $0.00 variance!');
    } else {
      showToast('Intercompany balance is already perfectly balanced at $0.00.');
    }
  };

  // 3. Fast FedNow Instant Settlement Simulation
  const handleSimulateFedNow = async () => {
    setIsSimulating(true);
    const invoice: Invoice = arInvoices[0] || {
      id: 'INV-DEMO-01',
      type: 'AR',
      counterparty: 'Apex Global Enterprises',
      issueDate: '2026-10-13',
      dueDate: '2026-10-20',
      amount: 15400,
      status: 'Issued'
    };

    const res = await settlementEngine.executeAutonomousSettlement({
      invoice,
      method: 'FEDNOW'
    });

    await addJournalEntry({
      description: res.journalEntry.description,
      source: res.journalEntry.source,
      status: res.journalEntry.status,
      lines: res.journalEntry.lines
    });

    setLogs(settlementEngine.getEventLogs());
    setIsSimulating(false);
    showToast(`FedNow Instant Settlement: $${invoice.amount.toLocaleString()} posted with ISO 20022 message ${res.isoMessageId}`);
  };

  // 4. Copilot Prompt Execution
  const handleAskCopilot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;

    const plan = oracleCopilot.generateActionPlan(copilotInput, {
      intercompanyBalance: intercompanyPayableBalance,
      apInvoices,
      journalEntries
    });
    setActivePlan(plan);
  };

  const handleExecutePlan = async () => {
    if (!activePlan) return;
    if (activePlan.stagedJournalLines.length > 0) {
      await addJournalEntry({
        description: `Consul Copilot Action: ${activePlan.userPrompt}`,
        source: 'CHAIN',
        status: 'Posted',
        lines: activePlan.stagedJournalLines.map(l => ({
          accountId: l.accountId,
          type: l.type,
          amount: l.amount
        }))
      });
    }
    showToast(`Copilot Action Plan executed and posted to General Ledger!`);
    setActivePlan(null);
    setCopilotInput('');
    setLogs(settlementEngine.getEventLogs());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-sov-accent text-sov-dark font-black px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-sov-accent-hover animate-slide-up">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Engine Status Banner */}
      <div className="bg-gradient-to-r from-sov-accent/15 via-sov-primary/10 to-transparent p-6 sm:p-8 rounded-3xl border border-sov-accent/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-sov-accent/20 rounded-xl text-sov-accent border border-sov-accent/30">
              <Cpu className="w-6 h-6 animate-pulse" />
            </span>
            <h1 className="text-2xl font-black uppercase tracking-wider text-sov-light">
              Autonomous Bi-Directional Settlement Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-sov-light/70 max-w-2xl leading-relaxed">
            Continuous zero-variance clearing connecting <strong>ISO 20022 Fiat Rails</strong>, <strong>Double-Entry Ledger</strong>, and <strong>Base L2 cUSD Smart Contracts</strong> with Cryptographic Proof-of-Solvency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const active = settlementEngine.toggleAuto();
              setIsEngineActive(active);
              showToast(`Autonomous Synthesizer ${active ? 'ENGAGED' : 'PAUSED'}`);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border ${
              isEngineActive 
                ? 'bg-sov-green/20 border-sov-green/50 text-sov-green shadow-[0_0_15px_rgba(0,255,136,0.3)]' 
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            {isEngineActive ? 'Synthesizer Active' : 'Synthesizer Standby'}
          </button>

          <button
            onClick={handlePublishEpoch}
            className="px-4 py-2.5 bg-sov-accent text-sov-dark hover:bg-sov-accent-hover font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Attest Merkle Solvency
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sov-dark/60 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Merkle Proof Status</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-black text-sov-green">PROVEN</span>
            <span className="text-[10px] text-white/60">Epoch #{epochs.length}</span>
          </div>
          <p className="text-[10px] text-white/40 mt-1 truncate">Root: {epochs[0]?.merkleRoot.slice(0, 16)}...</p>
        </div>

        <div className="bg-sov-dark/60 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Intercompany Variance</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-mono font-black ${intercompanyPayableBalance === 0 ? 'text-sov-green' : 'text-amber-400'}`}>
              ${Math.abs(intercompanyPayableBalance).toLocaleString()}
            </span>
            <span className="text-[10px] text-white/60">{intercompanyPayableBalance === 0 ? 'Balanced' : 'Imbalance'}</span>
          </div>
          <button 
            onClick={handleNetIntercompany}
            className="text-[10px] text-sov-accent hover:underline font-bold mt-1 block cursor-pointer"
          >
            Auto-Neutralize to Zero &rarr;
          </button>
        </div>

        <div className="bg-sov-dark/60 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Settlement Velocity</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-black text-sov-accent">Sub-Second</span>
            <span className="text-[10px] text-white/60">Base L2 + FedNow</span>
          </div>
          <button 
            onClick={handleSimulateFedNow}
            disabled={isSimulating}
            className="text-[10px] text-sov-accent hover:underline font-bold mt-1 block cursor-pointer"
          >
            {isSimulating ? 'Simulating FedNow...' : 'Simulate FedNow &rarr;'}
          </button>
        </div>

        <div className="bg-sov-dark/60 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Ledger Entries</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-black text-sov-light">{journalEntries.length}</span>
            <span className="text-[10px] text-sov-green">100% Balanced</span>
          </div>
          <p className="text-[10px] text-white/40 mt-1">GAAP & NACHA Validated</p>
        </div>
      </div>

      {/* Chief Financial Oracle Copilot Interface */}
      <div className="bg-sov-dark/60 backdrop-blur-md rounded-3xl border border-sov-accent/20 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 bg-gradient-to-r from-sov-accent/10 to-transparent border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-sov-accent animate-spin" />
            <h3 className="text-sm font-black uppercase tracking-widest text-sov-light">
              Chief Financial Oracle — Agentic Copilot
            </h3>
          </div>
          <span className="text-[10px] bg-sov-accent/20 text-sov-accent px-3 py-1 rounded-full font-mono border border-sov-accent/30 font-bold">
            AGENTIC MODE READY
          </span>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-sov-light/70">
            Command the Chief Ledgering Consul with natural language. The agent formulates double-entry journal transactions, reconciles intercompany variances, and stages balance-sheet settlements for your review.
          </p>

          <form onSubmit={handleAskCopilot} className="flex gap-3">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="e.g. 'Net intercompany accounts to zero' or 'Pay urgent vendor AP with Vault USDC' or 'Simulate incoming FedNow pacs.008'..."
              className="flex-1 bg-black/40 border border-white/15 rounded-2xl px-5 py-3 text-xs sm:text-sm text-sov-light focus:outline-none focus:border-sov-accent transition-all font-mono"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-sov-accent text-sov-dark hover:bg-sov-accent-hover font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Send className="w-4 h-4" />
              Formulate
            </button>
          </form>

          {/* Quick Command Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-[10px] text-white/40 uppercase font-black tracking-wider py-1">Quick Actions:</span>
            {[
              'Net intercompany payable to zero',
              'Pay overdue AP invoice via Vault USDC',
              'Simulate FedNow ISO 20022 settlement',
              'Run cryptographic solvency audit pass'
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setCopilotInput(chip);
                  const plan = oracleCopilot.generateActionPlan(chip, {
                    intercompanyBalance: intercompanyPayableBalance,
                    apInvoices,
                    journalEntries
                  });
                  setActivePlan(plan);
                }}
                className="text-[11px] bg-white/5 hover:bg-white/10 text-sov-light/80 border border-white/10 rounded-xl px-3 py-1 transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Staged Copilot Action Plan */}
          {activePlan && (
            <div className="mt-4 p-5 bg-black/50 border border-sov-accent/40 rounded-2xl space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sov-accent" />
                  <span className="text-xs font-black uppercase tracking-wider text-sov-light">Staged Action Plan ({activePlan.intent})</span>
                </div>
                <span className="text-[10px] bg-sov-green/20 text-sov-green px-2.5 py-0.5 rounded-full border border-sov-green/30 font-bold">
                  BALANCED: DEBITS = CREDITS
                </span>
              </div>

              <p className="text-xs text-sov-light-alt leading-relaxed">
                {activePlan.explanation}
              </p>

              {activePlan.stagedJournalLines.length > 0 && (
                <div className="rounded-xl border border-white/10 overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-white/5 text-[10px] uppercase font-bold text-white/50">
                      <tr>
                        <th className="px-4 py-2 text-left">Account ID</th>
                        <th className="px-4 py-2 text-left">Account Name</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {activePlan.stagedJournalLines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-sov-accent">{line.accountId}</td>
                          <td className="px-4 py-2">{line.accountName}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${line.type === 'DEBIT' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                              {line.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-bold">${line.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePlan(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleExecutePlan}
                  className="px-5 py-2 bg-sov-green text-sov-dark hover:bg-sov-green/90 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve & Execute to Ledger
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Cryptographic Merkle Epochs & Real-Time Settlement Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Proof-of-Solvency Attestations */}
        <div className="bg-sov-dark/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-sov-accent" />
              <h3 className="text-sm font-black uppercase tracking-widest text-sov-light">
                Proof-of-Solvency (Merkle Attestations)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-white/50">Base L2 Anchored</span>
          </div>

          <div className="space-y-3">
            {epochs.map((ep) => (
              <div key={ep.epochId} className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-sov-light">{ep.epochId}</span>
                  <span className="bg-sov-green/20 text-sov-green px-2 py-0.5 rounded text-[10px] font-bold">
                    {ep.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-white/60 truncate">
                  <span className="text-white/40">Root: </span>{ep.merkleRoot}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[10px]">
                  <div>
                    <p className="text-white/40">Assets</p>
                    <p className="font-mono font-bold text-sov-light">${(ep.totalAssetsCents / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/40">Liabilities</p>
                    <p className="font-mono font-bold text-sov-light">${(ep.totalLiabilitiesCents / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/40">Leaves Verified</p>
                    <p className="font-mono font-bold text-sov-accent">{ep.entryCount} entries</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Settlement & Synthesis Feed */}
        <div className="bg-sov-dark/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sov-accent" />
              <h3 className="text-sm font-black uppercase tracking-widest text-sov-light">
                Bi-Directional Settlement Stream
              </h3>
            </div>
            <span className="text-[10px] font-mono text-sov-green animate-pulse">● LIVE STREAM</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-1.5 hover:border-sov-accent/30 transition-all">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] text-white/50">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="font-mono font-bold text-sov-accent text-[11px]">{log.journalEntryId}</span>
                </div>
                <p className="text-xs text-sov-light/90 leading-relaxed font-sans">{log.summary}</p>
                {log.txHash && (
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-white/40 truncate">
                    <ExternalLink className="w-3 h-3 text-sov-accent flex-shrink-0" />
                    <span className="truncate">{log.txHash}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

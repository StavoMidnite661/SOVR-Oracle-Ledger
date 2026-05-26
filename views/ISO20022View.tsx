import React, { useState, useCallback, useRef } from 'react';
import { FileText, Download, Upload, CheckCircle, AlertCircle, ChevronRight, Copy, Code2, ArrowUpDown, Eye } from 'lucide-react';
import type { AchPayment, ISO20022GeneratedMessage, ParsedBankStatement, ParsedStatementTransaction } from '../types.js';
import { iso20022Service } from '../services/iso20022Service.js';

// Virtualization logic moved to iso20022Service.ts or handled via service flags.

// ─── Types ────────────────────────────────────────────────────────

type Tab = 'generate' | 'import';

interface ISO20022ViewProps {
  achPayments?: AchPayment[];
}

// ─── Component ────────────────────────────────────────────────────

export const ISO20022View: React.FC<ISO20022ViewProps> = ({
  achPayments = [],
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);
  const [importedXml, setImportedXml] = useState<string | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedStatementTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [virtualize, setVirtualize] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Generate Tab ─────────────────────────────────────────────

  const togglePayment = (id: string) => {
    setSelectedPayments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPayments.size === achPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(achPayments.map(p => p.id)));
    }
  };

  const handleGenerate = useCallback(() => {
    const selected = achPayments.filter(p => selectedPayments.has(p.id));
    if (selected.length === 0) return;
    
    // In live mode, we should have real creditor details. 
    // For now, we use the service which uses the configured defaults or payment metadata.
    const message = iso20022Service.generateACHCreditInitiation(
      selected,
      selected.map(p => ({
        name: p.description || 'Recipient',
        accountNumber: 'REDACTED', // Should be fetched from secure vault/metadata
        routingNumber: 'REDACTED',
        remittanceInfo: p.description
      }))
    );
    
    setGeneratedXml(message.xml);
    setShowPreview(true);
  }, [achPayments, selectedPayments]);

  const handleDownload = useCallback(() => {
    if (!generatedXml) return;
    const blob = new Blob([generatedXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOVR-PAIN001-${new Date().toISOString().split('T')[0]}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedXml]);

  const handleCopy = useCallback(async () => {
    if (!generatedXml) return;
    await navigator.clipboard.writeText(generatedXml);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [generatedXml]);

  // ─── Import Tab ───────────────────────────────────────────────

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const xml = ev.target?.result as string;
      setImportedXml(xml);
      
      try {
        const statement = iso20022Service.parseBankStatement(xml);
        // Flatten all entries from all statements for simple display
        const allTxns = statement.statements.flatMap(s => s.entries);
        setParsedTransactions(allTxns);
      } catch (err) {
        console.error('Failed to parse ISO 20022 statement:', err);
        alert('Invalid or unsupported CAMT.053 XML format.');
      }
    };
    reader.readAsText(file);
  }, []);



  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  // ─── JSX ──────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Tab Bar */}
      <div className="bg-sov-dark-alt/30 border border-white/5 rounded-2xl overflow-hidden glass-panel">
        <div className="flex border-b border-white/5 bg-white/2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 border-b-2 transition-all duration-300 whitespace-nowrap ${
              activeTab === 'generate'
                ? 'border-sov-accent text-sov-accent bg-sov-accent/5'
                : 'border-transparent text-sov-light-alt hover:text-sov-light hover:bg-white/5'
            }`}
          >
            <FileText size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Generate PAIN.001</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 border-b-2 transition-all duration-300 whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-sov-accent text-sov-accent bg-sov-accent/5'
                : 'border-transparent text-sov-light-alt hover:text-sov-light hover:bg-white/5'
            }`}
          >
            <Upload size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Import CAMT.053</span>
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center px-6 py-2">
            <button 
              onClick={() => setVirtualize(!virtualize)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                virtualize 
                  ? 'bg-sov-accent text-sov-dark shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                  : 'bg-white/5 text-sov-light-alt border border-white/10'
              }`}
            >
              <ArrowUpDown size={10} />
              <span>{virtualize ? 'Virtualization ON' : 'Live Mode'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 min-h-[400px]">
          {/* ─── Generate Tab ─────────────────────────────── */}
          {activeTab === 'generate' && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              {/* Payment Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-sov-light uppercase tracking-tight">
                    Select Payments
                  </h3>
                  <button
                    onClick={selectAll}
                    className="text-[10px] font-bold text-sov-accent uppercase tracking-widest hover:text-sov-light transition-colors"
                  >
                    {selectedPayments.size === achPayments.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2">
                  {achPayments.map(payment => (
                    <button
                      key={payment.id}
                      onClick={() => togglePayment(payment.id)}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                        selectedPayments.has(payment.id)
                          ? 'border-sov-accent/50 bg-sov-accent/5'
                          : 'border-white/5 bg-white/2 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selectedPayments.has(payment.id)
                              ? 'border-sov-accent bg-sov-accent'
                              : 'border-white/20'
                          }`}>
                            {selectedPayments.has(payment.id) && <CheckCircle size={12} className="text-sov-dark" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-sov-light truncate">
                              {payment.description || `ACH Payment #${payment.id}`}
                            </p>
                            <p className="text-[10px] text-sov-light-alt uppercase tracking-widest">
                              {payment.achClassCode} · {payment.status} · {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-sov-accent ml-2 flex-shrink-0">
                          {formatCurrency(payment.amountCents)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {achPayments.length === 0 && (
                  <div className="text-center py-8 text-sov-light-alt opacity-40">
                    <AlertCircle size={32} className="mx-auto mb-2" />
                    <p className="text-xs uppercase tracking-widest">No ACH payments available</p>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={selectedPayments.size === 0}
                  className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedPayments.size > 0
                      ? 'bg-sov-accent text-sov-dark hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                      : 'bg-white/5 text-sov-light-alt/40 cursor-not-allowed'
                  }`}
                >
                  <Code2 size={14} />
                  <span>Generate PAIN.001 ({selectedPayments.size})</span>
                </button>

                {generatedXml && (
                  <>
                    <button
                      onClick={handleDownload}
                      className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-sov-accent/30 text-sov-accent hover:bg-sov-accent/10 transition-all"
                    >
                      <Download size={14} />
                      <span>Download XML</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 text-sov-light-alt hover:bg-white/5 transition-all"
                    >
                      <Copy size={14} />
                      <span>{copySuccess ? 'Copied!' : 'Copy XML'}</span>
                    </button>
                  </>
                )}
              </div>

              {/* XML Preview */}
              {generatedXml && showPreview && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Eye size={14} className="text-sov-accent" />
                      <span className="text-[10px] font-black text-sov-light uppercase tracking-[0.2em]">XML Preview</span>
                    </div>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-[10px] font-bold text-sov-light-alt uppercase tracking-widest hover:text-sov-light transition-colors"
                    >
                      Hide
                    </button>
                  </div>
                  <pre className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-sov-green/80 font-mono overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                    {generatedXml}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ─── Import Tab ──────────────────────────────── */}
          {activeTab === 'import' && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              {/* Upload Area */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center space-x-3 p-6 sm:p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-sov-accent/40 text-sov-light-alt hover:text-sov-accent transition-all group"
                >
                  <Upload size={24} className="group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Upload CAMT.053 XML</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-60">Bank statement file</p>
                  </div>
                </button>

              </div>

              {/* Parsed Transactions */}
              {parsedTransactions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-sov-light uppercase tracking-tight flex items-center space-x-2">
                      <ArrowUpDown size={14} className="text-sov-accent" />
                      <span>Parsed Transactions ({parsedTransactions.length})</span>
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-sov-green rounded-full" />
                      <span className="text-[10px] font-bold text-sov-green uppercase tracking-[0.15em]">Parsed</span>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="space-y-2">
                    {parsedTransactions.map(txn => (
                      <div
                        key={txn.id}
                        className="p-3 sm:p-4 rounded-xl border border-white/5 bg-white/2 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                txn.creditDebit === 'credit'
                                  ? 'bg-sov-green/20 text-sov-green'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {txn.creditDebit}
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                txn.matchStatus === 'matched'
                                  ? 'bg-sov-accent/20 text-sov-accent'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {txn.matchStatus}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-sov-light truncate">
                              {txn.counterpartyName || 'Unknown'}
                            </p>
                            <p className="text-[10px] text-sov-light-alt truncate">
                              {txn.description}
                            </p>
                            <p className="text-[10px] text-sov-light-alt/60 mt-1">
                              {txn.date} · Ref: {txn.reference || '—'}
                            </p>
                          </div>
                          <span className={`text-sm font-black flex-shrink-0 ${
                            txn.creditDebit === 'credit' ? 'text-sov-green' : 'text-red-400'
                          }`}>
                            {txn.creditDebit === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw XML Preview */}
              {importedXml && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Code2 size={14} className="text-sov-light-alt" />
                    <span className="text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em]">Raw XML</span>
                  </div>
                  <pre className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-sov-light-alt/70 font-mono overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                    {importedXml}
                  </pre>
                </div>
              )}

              {parsedTransactions.length === 0 && !importedXml && (
                <div className="text-center py-12 text-sov-light-alt opacity-30">
                  <Upload size={40} className="mx-auto mb-3" />
                  <p className="text-xs uppercase tracking-widest">Upload a CAMT.053 file or load the sample</p>
                  <p className="text-[10px] opacity-60 mt-1">Supports ISO 20022 Bank-to-Customer Statement</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import type { JournalEntry, AchPayment, StripeCustomer, Vendor } from '../types.js';
import { CHART_OF_ACCOUNTS } from '../constants.js';
import { Modal } from '../components/shared/Modal.js';
import { 
  ModalInput, 
  ModalSelect, 
  ModalButton, 
  ModalLabel, 
  ModalSection, 
  ModalField,
  ModalSectionHeader
} from '../components/shared/ModalElements.js';

interface JournalViewProps {
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
  achPayments?: AchPayment[];
  stripeCustomers?: StripeCustomer[];
  vendors?: Vendor[];
}

type SortableKeys = keyof JournalEntry | 'amount';
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };

const getAccountName = (id: number) => CHART_OF_ACCOUNTS.find(acc => acc.id === id)?.name || 'Unknown Account';

const SortIndicator: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => (
  <span className="inline-flex flex-col text-xs ml-2 opacity-50">
    <svg className={`h-2 w-2 ${direction === 'ascending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l-5 5h10l-5-5z"/></svg>
    <svg className={`h-2 w-2 ${direction === 'descending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l5-5H5l5 5z"/></svg>
  </span>
);

export const JournalView: React.FC<JournalViewProps> = ({ 
  journalEntries, 
  addJournalEntry,
  achPayments = [],
  stripeCustomers = [],
  vendors = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [debitAccountId, setDebitAccountId] = useState<number | ''>('');
  const [creditAccountId, setCreditAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [source, setSource] = useState<JournalEntry['source']>('PURCHASE');
  const [vendorId, setVendorId] = useState<string>('');
  const [referenceDocument, setReferenceDocument] = useState(''); // NEW
  const [memo, setMemo] = useState(''); // NEW
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'descending' });
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'ach' | 'stripe' | 'nacha' | 'intercompany'>('all');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [approvalComment, setApprovalComment] = useState(''); // NEW for approval workflow

  const filteredAndSortedJournalEntries = useMemo(() => {
    let filteredItems = [...journalEntries];

    // Apply payment filter
    if (paymentFilter !== 'all') {
      filteredItems = filteredItems.filter(entry => {
        switch (paymentFilter) {
          case 'ach':
            return entry.source === 'PAYMENT' || entry.source === 'AR';
          case 'stripe':
            return entry.source === 'PAYMENT';
          case 'nacha':
            return entry.source === 'NACHA';
          case 'intercompany':
            return entry.source === 'INTERCOMPANY';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        const key = sortConfig.key;
        let aValue: any;
        let bValue: any;

        if (key === 'amount') {
          aValue = a.lines?.[0]?.amount ?? 0;
          bValue = b.lines?.[0]?.amount ?? 0;
        } else {
          aValue = a[key as keyof JournalEntry];
          bValue = b[key as keyof JournalEntry];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredItems;
  }, [journalEntries, sortConfig, paymentFilter]);

  const getStripePaymentInfo = (entry: JournalEntry) => {
    const relatedPayment = achPayments.find(payment => 
      payment.journalEntryId === entry.id
    );
    
    if (!relatedPayment) return null;

    const customer = stripeCustomers.find(c => c.id === relatedPayment.customerId);
    
    return {
      payment: relatedPayment,
      customer: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer',
      status: relatedPayment.status,
      amount: relatedPayment.amountCents / 100,
    };
  };

  const getReconciliationStatus = (entry: JournalEntry) => {
    const relatedPayment = achPayments.find(payment => 
      payment.journalEntryId === entry.id
    );
    
    if (!relatedPayment) return null;
    
    if (relatedPayment.status === 'succeeded') {
      return { status: 'reconciled', color: 'bg-sov-green/20 text-sov-green' };
    } else if (relatedPayment.status === 'pending') {
      return { status: 'pending', color: 'bg-sov-gold/20 text-sov-gold' };
    } else if (relatedPayment.status === 'failed') {
      return { status: 'failed', color: 'bg-sov-red/20 text-sov-red' };
    }
    
    return null;
  };

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  const resetForm = () => {
    setDescription('');
    setDebitAccountId('');
    setCreditAccountId('');
    setAmount('');
    setSource('PURCHASE');
    setVendorId('');
    setReferenceDocument('');
    setMemo('');
    setError('');
  };

  const handlePostEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !debitAccountId || !creditAccountId || !amount || amount <= 0) {
      setError('All fields are required and amount must be positive.');
      return;
    }
    if (debitAccountId === creditAccountId) {
      setError('Debit and Credit accounts must be different.');
      return;
    }
    setError('');
    
    // NEW: Include audit fields
    addJournalEntry({
      description,
      source,
      status: 'Pending', // Changed to Pending for approval workflow
      vendorId: vendorId || undefined,
      referenceDocument: referenceDocument || undefined,
      memo: memo || undefined,
      createdBy: 'current-user', // In real app: from auth context
      lines: [
        { accountId: debitAccountId, type: 'DEBIT', amount: +amount },
        { accountId: creditAccountId, type: 'CREDIT', amount: +amount },
      ]
    });
    setIsModalOpen(false);
    resetForm();
  };
  
  const getSortDirection = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) return undefined;
    return sortConfig.direction;
  };

  // NEW: Approval / Void workflow
  const handleApproveEntry = (entryId: string) => {
    // In a real app, this would call an API to update the entry
    console.log(`Approving journal entry ${entryId} with comment: ${approvalComment}`);
    // For demo, we'll just close the modal
    setSelectedEntry(null);
    setApprovalComment('');
  };

  const handleVoidEntry = (entryId: string) => {
    console.log(`Voiding journal entry ${entryId}`);
    setSelectedEntry(null);
  };

  return (
    <>
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 max-h-[600px] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-sov-light">General Journal</h3>
            <div className="mt-2">
              <label htmlFor="paymentFilter" className="block text-sm font-medium text-sov-light-alt mb-1">Filter by Payment Type</label>
              <select 
                id="paymentFilter" 
                value={paymentFilter} 
                onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
                className="bg-sov-dark border border-gray-600 rounded-md shadow-sm py-1 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent text-sm"
              >
                <option value="all">All Entries</option>
                <option value="ach">ACH & Stripe Payments</option>
                <option value="nacha">NACHA Transactions</option>
                <option value="intercompany">Intercompany</option>
                <option value="stripe">Stripe Only</option>
              </select>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-xl hover:bg-sov-accent-hover transition-all shadow-lg shadow-sov-accent/10 active:scale-95">
            Post New Entry
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('id')}>
                    <div className="flex items-center">ID <SortIndicator direction={getSortDirection('id')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}>
                    <div className="flex items-center">Date <SortIndicator direction={getSortDirection('date')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('description')}>
                    <div className="flex items-center">Description <SortIndicator direction={getSortDirection('description')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('source')}>
                    <div className="flex items-center">Source <SortIndicator direction={getSortDirection('source')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}>
                    <div className="flex items-center">Status <SortIndicator direction={getSortDirection('status')} /></div>
                </th>
                <th className="p-3 text-center">Payment Method</th>
                <th className="p-3 text-center">Reconciliation</th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('amount')}>
                    <div className="flex items-center justify-end">Amount <SortIndicator direction={getSortDirection('amount')} /></div>
                </th>
                <th className="p-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedJournalEntries.map(entry => {
                const stripeInfo = getStripePaymentInfo(entry);
                const reconStatus = getReconciliationStatus(entry);
                
                return (
                  <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 font-mono text-sm">{entry.id}</td>
                    <td className="p-3">{entry.date}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{entry.description}</div>
                        {stripeInfo && (
                          <div className="text-xs text-sov-light-alt mt-1">
                            Customer: {stripeInfo.customer}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-sov-accent/20 text-sov-accent`}>
                        {entry.source}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'Posted' ? 'bg-sov-green/20 text-sov-green' :
                        entry.status === 'Approved' ? 'bg-sov-accent/20 text-sov-accent' :
                        entry.status === 'Voided' ? 'bg-sov-red/20 text-sov-red' :
                        'bg-sov-gold/20 text-sov-gold'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {stripeInfo ? (
                        <div>
                          <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            stripeInfo.payment.paymentMethodType === 'us_bank_account' ? 'bg-blue-500/20 text-blue-400' :
                            stripeInfo.payment.paymentMethodType === 'card' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {stripeInfo.payment.paymentMethodType === 'us_bank_account' ? 'ACH' :
                             stripeInfo.payment.paymentMethodType === 'card' ? 'Card' :
                             stripeInfo.payment.paymentMethodType}
                          </div>
                        </div>
                      ) : entry.source === 'NACHA' ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-400">
                          NACHA
                        </span>
                      ) : entry.source === 'INTERCOMPANY' ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sov-gold/20 text-sov-gold">
                          Internal
                        </span>
                      ) : (
                        <span className="text-sov-light-alt text-xs">Manual</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {reconStatus ? (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${reconStatus.color}`}>
                          {reconStatus.status}
                        </span>
                      ) : (
                        <span className="text-sov-light-alt text-xs">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">${entry.lines?.[0]?.amount?.toLocaleString() ?? '0'}</td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => setSelectedEntry(entry)}
                        className="bg-sov-gold/10 text-sov-gold border border-sov-gold/20 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-sov-gold/20 transition-all active:scale-95"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Post New Journal Entry"
        gradient="from-sov-accent/20 to-sov-accent/5"
      >
        <form onSubmit={handlePostEntry} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium animate-in fade-in">
              {error}
            </div>
          )}
          
          <ModalSection>
             <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                <div className="flex-1 space-y-4">
                   <div>
                     <ModalLabel htmlFor="description">Description</ModalLabel>
                     <ModalInput 
                       type="text" 
                       id="description" 
                       value={description} 
                       onChange={e => setDescription(e.target.value)} 
                       required 
                       placeholder="e.g. Monthly Server Costs"
                       className="text-lg font-medium"
                     />
                   </div>
                   {/* NEW: Reference Document & Memo for Audit Trail */}
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <ModalLabel htmlFor="referenceDocument">Reference Document</ModalLabel>
                       <ModalInput 
                         type="text" 
                         id="referenceDocument" 
                         value={referenceDocument} 
                         onChange={e => setReferenceDocument(e.target.value)} 
                         placeholder="INV-2025-001 or Receipt #123"
                       />
                     </div>
                     <div>
                       <ModalLabel htmlFor="memo">Memo / Notes</ModalLabel>
                       <ModalInput 
                         type="text" 
                         id="memo" 
                         value={memo} 
                         onChange={e => setMemo(e.target.value)} 
                         placeholder="Additional context for audit"
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <ModalLabel htmlFor="amount">Amount</ModalLabel>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg font-mono">$</span>
                            <ModalInput 
                               type="number" 
                               id="amount" 
                               value={amount} 
                               onChange={e => setAmount(e.target.valueAsNumber || '')} 
                               min="0.01" 
                               step="0.01" 
                               required 
                               className="pl-8 font-mono text-xl"
                               placeholder="0.00"
                            />
                         </div>
                      </div>
                      <div>
                         <ModalLabel htmlFor="source">Source</ModalLabel>
                         <ModalSelect
                            id="source"
                            value={source}
                            onChange={e => setSource(e.target.value as any)}
                         >
                            <option value="PURCHASE">PURCHASE</option>
                            <option value="PAYMENT">PAYMENT</option>
                            <option value="CHAIN">CHAIN</option>
                            <option value="NACHA">NACHA</option>
                            <option value="PO">PO</option>
                            <option value="AR">AR</option>
                            <option value="AP">AP</option>
                            <option value="PAYROLL">PAYROLL</option>
                            <option value="INTERCOMPANY">INTERCOMPANY</option>
                         </ModalSelect>
                      </div>
                   </div>
                </div>
             </div>
          </ModalSection>

          <ModalSection>
             <div className="grid grid-cols-2 gap-6">
                <div>
                   <ModalLabel>Debit Account</ModalLabel>
                   <ModalSelect
                      value={debitAccountId} 
                      onChange={e => setDebitAccountId(Number(e.target.value))}
                   >
                     <option value="" disabled>Select Account</option>
                     {CHART_OF_ACCOUNTS.map(acc => (
                       <option key={acc.id} value={acc.id}>{acc.id} - {acc.name}</option>
                     ))}
                   </ModalSelect>
                </div>
                <div>
                   <ModalLabel>Credit Account</ModalLabel>
                   <ModalSelect
                      value={creditAccountId} 
                      onChange={e => setCreditAccountId(Number(e.target.value))}
                   >
                     <option value="" disabled>Select Account</option>
                     {CHART_OF_ACCOUNTS.map(acc => (
                       <option key={acc.id} value={acc.id}>{acc.id} - {acc.name}</option>
                     ))}
                   </ModalSelect>
                </div>
             </div>
          </ModalSection>
          
          <ModalSection>
             <ModalSectionHeader>Metadata</ModalSectionHeader>
             <div>
                <ModalLabel htmlFor="vendor">Linked Vendor (Optional)</ModalLabel>
                <ModalSelect
                   id="vendor" 
                   value={vendorId} 
                   onChange={e => setVendorId(e.target.value)} 
                >
                   <option value="">No Vendor Linked</option>
                   {vendors.map(v => (
                     <option key={v.id} value={v.id}>{v.name}</option>
                   ))}
                </ModalSelect>
             </div>
             
             {source === 'PAYMENT' && (
                 <div className="mt-4 p-3 bg-sov-dark border border-white/5 rounded-lg">
                     <h4 className="text-xs font-bold text-white mb-1">Stripe Integration</h4>
                     <p className="text-[10px] text-white/50 leading-relaxed">This entry will be automatically linked to Stripe ACH transactions for reconciliation purposes.</p>
                 </div>
             )}
          </ModalSection>

          <div className="flex justify-end pt-4 space-x-3">
            <ModalButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
               Cancel
            </ModalButton>
            <ModalButton type="submit">
               Post Entry
            </ModalButton>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!selectedEntry} 
        onClose={() => setSelectedEntry(null)} 
        title="Journal Entry Details"
        gradient="from-sov-gold/20 to-sov-gold/5"
      >
        {selectedEntry && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="grid grid-cols-2 gap-6">
               <ModalSection>
                  <ModalField label="Entry ID" value={<span className="font-mono text-xl text-sov-light font-bold">{selectedEntry.id}</span>} />
               </ModalSection>
               <ModalSection className="text-right">
                  <ModalField label="Date" value={selectedEntry.date} />
               </ModalSection>
            </div>
            
            <ModalSection>
               <ModalField label="Description" value={<span className="text-lg text-sov-light font-medium">{selectedEntry.description}</span>} />
            </ModalSection>
            
            {selectedEntry.vendorId && (
               <ModalSection>
                  <ModalField label="Linked Vendor" value={<span className="text-sov-accent font-bold text-lg">{vendors.find(v => v.id === selectedEntry.vendorId)?.name || 'Unknown Vendor'}</span>} />
               </ModalSection>
            )}
            
            <ModalSection>
              <ModalSectionHeader>Journal Lines</ModalSectionHeader>
              <div className="space-y-3 mt-2">
                {selectedEntry.lines.map((line, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 last:pb-0 first:pt-0">
                    <span className="text-sov-light font-medium text-sm">{getAccountName(line.accountId)}</span>
                    <span className={`font-mono font-bold ${line.type === 'DEBIT' ? 'text-sov-green' : 'text-sov-red'}`}>
                      {line.type === 'DEBIT' ? 'Dr' : 'Cr'} ${line.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </ModalSection>

            {(() => {
              const stripeInfo = getStripePaymentInfo(selectedEntry);
              if (stripeInfo) {
                return (
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 p-6 rounded-2xl border border-white/10">
                    <h4 className="text-sm font-bold text-sov-light uppercase tracking-wider mb-4 flex items-center">
                       <span className="w-2 h-2 rounded-full bg-purple-500 mr-2 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                       Stripe Payment Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-sov-light-alt uppercase tracking-wide mb-1">Customer</p>
                        <p className="text-sov-light font-bold truncate">{stripeInfo.customer}</p>
                      </div>
                      <div>
                        <p className="text-xs text-sov-light-alt uppercase tracking-wide mb-1">Method</p>
                        <p className="text-sov-light font-bold capitalize">{stripeInfo.payment.paymentMethodType.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-sov-light-alt uppercase tracking-wide mb-1">Amount</p>
                        <p className="text-sov-light font-mono font-bold">${stripeInfo.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-sov-light-alt uppercase tracking-wide mb-1">Status</p>
                        <span className={`inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                          stripeInfo.status === 'succeeded' ? 'bg-sov-green/20 text-sov-green border border-sov-green/30' :
                          stripeInfo.status === 'pending' ? 'bg-sov-gold/20 text-sov-gold border border-sov-gold/30' :
                          'bg-sov-red/20 text-sov-red border border-sov-red/30'
                        }`}>
                          {stripeInfo.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-end pt-2 space-x-3">
              {selectedEntry.status === 'Pending' && (
                <>
                  <ModalButton 
                    variant="secondary" 
                    onClick={() => handleVoidEntry(selectedEntry.id)}
                    className="bg-red-500/10 text-red-400 border-red-500/30"
                  >
                    Void Entry
                  </ModalButton>
                  <ModalButton onClick={() => handleApproveEntry(selectedEntry.id)}>
                    Approve Entry
                  </ModalButton>
                </>
              )}
              <ModalButton variant="secondary" onClick={() => setSelectedEntry(null)}>Close Details</ModalButton>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

import React, { useState, useMemo } from 'react';
import type { CompanyCard, CardTransaction, AuditEvent, CardRevealRequest, CardRevealResponse } from '../types.js';
import { Entity, SpendCategory } from '../types.js';
import { Modal } from '../components/shared/Modal.js';
import { 
  ModalInput, 
  ModalSelect, 
  ModalTextarea,
  ModalButton, 
  ModalLabel, 
  ModalSection,
  ModalSectionHeader,
  ModalField 
} from '../components/shared/ModalElements.js';

interface CardManagementViewProps {
  cards: CompanyCard[];
  transactions: CardTransaction[];
  addCard: (card: Omit<CompanyCard, 'id' | 'issueDate' | 'spentThisMonth' | 'spentThisQuarter' | 'spentThisYear' | 'lastActivity'>) => void;
  updateCard: (cardId: string, updates: Partial<CompanyCard>) => void;
}

type SortableKeys = keyof CompanyCard | keyof CardTransaction;
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };

const getCardTypeColor = (cardType: CompanyCard['cardType']) => {
  switch (cardType) {
    case 'Virtual': return 'bg-blue-500/20 text-blue-400';
    case 'Physical': return 'bg-green-500/20 text-green-400';
    case 'Fleet': return 'bg-orange-500/20 text-orange-400';
    case 'Gas': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getStatusColor = (status: CompanyCard['status']) => {
  switch (status) {
    case 'Active': return 'bg-sov-green/20 text-sov-green';
    case 'Suspended': return 'bg-yellow-500/20 text-yellow-400';
    case 'Expired': return 'bg-sov-red/20 text-sov-red';
    case 'Cancelled': return 'bg-gray-500/20 text-gray-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getTransactionStatusColor = (status: CardTransaction['status']) => {
  switch (status) {
    case 'Posted': return 'bg-sov-green/20 text-sov-green';
    case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
    case 'Declined': return 'bg-sov-red/20 text-sov-red';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getCategoryColor = (category: SpendCategory) => {
  const colorMap: Record<SpendCategory, string> = {
    [SpendCategory.Office]: 'bg-gray-500/20 text-gray-400',
    [SpendCategory.Travel]: 'bg-blue-500/20 text-blue-400',
    [SpendCategory.Meals]: 'bg-green-500/20 text-green-400',
    [SpendCategory.Software]: 'bg-purple-500/20 text-purple-400',
    [SpendCategory.Marketing]: 'bg-pink-500/20 text-pink-400',
    [SpendCategory.Fuel]: 'bg-orange-500/20 text-orange-400',
    [SpendCategory.Maintenance]: 'bg-red-500/20 text-red-400',
    [SpendCategory.Professional]: 'bg-indigo-500/20 text-indigo-400',
    [SpendCategory.Equipment]: 'bg-cyan-500/20 text-cyan-400',
    [SpendCategory.Utilities]: 'bg-teal-500/20 text-teal-400',
    [SpendCategory.Training]: 'bg-yellow-500/20 text-yellow-400',
    [SpendCategory.Insurance]: 'bg-emerald-500/20 text-emerald-400',
    [SpendCategory.Other]: 'bg-gray-500/20 text-gray-400',
  };
  return colorMap[category] || 'bg-gray-500/20 text-gray-400';
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const getCardMonthlySpend = (cardId: string, transactions: CardTransaction[]): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  return transactions
    .filter(t => {
      const postingDate = new Date(t.postingDate || t.transactionDate);
      return t.cardId === cardId && 
             t.status === 'Posted' && 
             postingDate.getMonth() === currentMonth && 
             postingDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

const getUtilizationPercentage = (spent: number, limit: number) => {
  if (limit === 0) return 0;
  return Math.min((spent / limit) * 100, 100);
};

const getUtilizationColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-sov-red';
  if (percentage >= 75) return 'bg-yellow-500';
  if (percentage >= 50) return 'bg-orange-500';
  return 'bg-sov-green';
};

export const CardManagementView: React.FC<CardManagementViewProps> = ({ 
  cards, 
  transactions, 
  addCard, 
  updateCard 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'transactions'>('overview');
  const [selectedCard, setSelectedCard] = useState<CompanyCard | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<CardTransaction | null>(null);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  
  // NEW: Expense tracking state
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [cardSortConfig, setCardSortConfig] = useState<SortConfig | null>({ key: 'assignedTo' as keyof CompanyCard, direction: 'ascending' });
  const [transactionSortConfig, setTransactionSortConfig] = useState<SortConfig | null>({ key: 'transactionDate' as keyof CardTransaction, direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCardType, setFilterCardType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Form state
  const [cardType, setCardType] = useState<CompanyCard['cardType']>('Virtual');
  const [cardProvider, setCardProvider] = useState<CompanyCard['cardProvider']>('Visa');
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedEntity, setAssignedEntity] = useState<Entity>(Entity.LLC);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(5000);
  const [dailyLimit, setDailyLimit] = useState<number>(500);
  const [transactionLimit, setTransactionLimit] = useState<number>(1000);
  const [billingAddress, setBillingAddress] = useState('123 Main St, San Francisco, CA 94105');
  const [notes, setNotes] = useState('');

  // Card reveal state
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealCardId, setRevealCardId] = useState<string>('');
  const [revealReason, setRevealReason] = useState('');
  const [revealedCardData, setRevealedCardData] = useState<{fullNumber: string, expiresAt: string, auditId: string} | null>(null);
  const [revealTimeRemaining, setRevealTimeRemaining] = useState<number>(0);

  const totalSpending = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return transactions
      .filter(t => {
        const postingDate = new Date(t.postingDate || t.transactionDate);
        return t.status === 'Posted' && 
               postingDate.getMonth() === currentMonth && 
               postingDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalLimits = useMemo(() => {
    return cards.reduce((sum, card) => sum + card.monthlyLimit, 0);
  }, [cards]);

  const activeCards = useMemo(() => {
    return cards.filter(card => card.status === 'Active').length;
  }, [cards]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.postingDate || b.transactionDate).getTime() - new Date(a.postingDate || a.transactionDate).getTime())
      .slice(0, 5);
  }, [transactions]);

  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards.filter(card => {
      const matchesSearch = searchTerm === '' || 
        card.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.cardNumber.last4.includes(searchTerm) ||
        card.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterCardType === '' || card.cardType === filterCardType;
      const matchesStatus = filterStatus === '' || card.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    if (cardSortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[cardSortConfig.key as keyof CompanyCard];
        const bValue = b[cardSortConfig.key as keyof CompanyCard];
        
        if (aValue < bValue) {
          return cardSortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return cardSortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [cards, cardSortConfig, searchTerm, filterCardType, filterStatus]);

  const requestCardSort = (key: keyof CompanyCard) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (cardSortConfig && cardSortConfig.key === key && cardSortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setCardSortConfig({ key, direction });
  };

  const resetForm = () => {
    setCardType('Virtual');
    setCardProvider('Visa');
    setAssignedTo('');
    setAssignedEntity(Entity.LLC);
    setMonthlyLimit(5000);
    setDailyLimit(500);
    setTransactionLimit(1000);
    setBillingAddress('123 Main St, San Francisco, CA 94105');
    setNotes('');
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedTo) return;
    
    const spendCategories = Object.values(SpendCategory);
    
    // NOTE: Card number generation is a placeholder until backend secure generation is implemented
    addCard({
      cardNumber: { last4: Math.floor(1000 + Math.random() * 9000).toString(), providerTokenId: `token_${Date.now()}` },
      cardType,
      cardProvider,
      assignedTo,
      assignedEntity,
      status: 'Active',
      monthlyLimit,
      dailyLimit,
      transactionLimit,
      spentThisMonth: 0,
      spentThisQuarter: 0,
      spentThisYear: 0,
      allowedCategories: spendCategories.slice(0, 5),
      blockedCategories: [],
      expirationDate: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 years from now
      billingAddress,
      notes: notes || undefined,
    });
    
    setIsNewCardModalOpen(false);
    resetForm();
  };

  const handleSuspendCard = (card: CompanyCard) => {
    updateCard(card.id, { status: 'Suspended' });
  };

  const handleActivateCard = (card: CompanyCard) => {
    updateCard(card.id, { status: 'Active' });
  };

  const handleUpdateLimits = (card: CompanyCard, newLimits: { monthlyLimit?: number; dailyLimit?: number; transactionLimit?: number }) => {
    updateCard(card.id, newLimits);
  };

  const handleViewTransaction = (transaction: CardTransaction) => {
    setSelectedTransaction(transaction);
  };

  // NEW: Flag transaction for policy violation
  const handleFlagTransaction = (transaction: CardTransaction) => {
    const reason = prompt('Reason for policy violation flag:');
    if (reason) {
      // In real app: update the transaction
      console.log('Flagging transaction for policy violation:', transaction.id, reason);
      alert('Transaction flagged (demo)');
    }
  };

  // NEW: Submit for reimbursement
  const handleSubmitReimbursement = (transaction: CardTransaction) => {
    console.log('Submitting for reimbursement:', transaction.id);
    alert('Reimbursement submitted (demo)');
  };

  // Card reveal functionality
  const handleRevealCard = (cardId: string) => {
    setRevealCardId(cardId);
    setRevealReason('');
    setShowRevealModal(true);
  };

  const submitCardReveal = () => {
    if (!revealReason.trim()) {
      alert('Please provide a reason for revealing the card number');
      return;
    }

    // Simulate API call for card reveal (in real app, this would be a secure backend call)
    const card = cards.find(c => c.id === revealCardId);
    if (!card) return;

    // Mock full card number based on last 4 digits and provider
    // PLACEHOLDER: This logic should move to a secure backend endpoint
    const providerPrefix = {
      'Visa': '4532',
      'Mastercard': '5555',
      'Amex': '3782',
      'Discover': '6011'
    }[card.cardProvider] || '4532';
    
    const fullNumber = `${providerPrefix}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${card.cardNumber.last4}`;
    const expiresAt = new Date(Date.now() + 60000).toISOString(); // 60 seconds from now
    const auditId = `AUDIT-${Date.now()}`;

    // Create audit event (in real app, this would be logged to backend)
    const auditEvent: AuditEvent = {
      id: auditId,
      timestamp: new Date().toISOString(),
      actor: 'Current User', // In real app, this would be the authenticated user
      action: 'CARD_NUMBER_REVEALED',
      targetId: revealCardId,
      reason: revealReason,
      result: 'SUCCESS',
      metadata: { cardType: card.cardType, provider: card.cardProvider }
    };

    console.log('Card reveal audit event:', auditEvent);

    setRevealedCardData({ fullNumber, expiresAt, auditId });
    setRevealTimeRemaining(60); // 60 seconds
    setShowRevealModal(false);

    // Start countdown timer
    const timer = setInterval(() => {
      setRevealTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setRevealedCardData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Card number copied to clipboard');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex space-x-4 border-b border-gray-700 pb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
              activeTab === 'overview' 
                ? 'bg-sov-accent text-sov-dark' 
                : 'text-sov-light-alt hover:text-sov-light'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
              activeTab === 'cards' 
                ? 'bg-sov-accent text-sov-dark' 
                : 'text-sov-light-alt hover:text-sov-light'
            }`}
          >
            Card Management
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
              activeTab === 'transactions' 
                ? 'bg-sov-accent text-sov-dark' 
                : 'text-sov-light-alt hover:text-sov-light'
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sov-light-alt">Total Monthly Spend</p>
                  <p className="text-2xl font-bold text-sov-light">{formatCurrency(totalSpending)}</p>
                </div>
                <div className="w-12 h-12 bg-sov-accent/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-sov-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getUtilizationColor(getUtilizationPercentage(totalSpending, totalLimits))}`}
                    style={{ width: `${getUtilizationPercentage(totalSpending, totalLimits)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-sov-light-alt mt-1">
                  {getUtilizationPercentage(totalSpending, totalLimits).toFixed(1)}% of {formatCurrency(totalLimits)} limit
                </p>
              </div>
            </div>

            <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sov-light-alt">Active Cards</p>
                  <p className="text-2xl font-bold text-sov-light">{activeCards}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-sov-light-alt mt-4">
                {cards.length} total cards issued
              </p>
            </div>

            <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sov-light-alt">Recent Transactions</p>
                  <p className="text-2xl font-bold text-sov-light">{transactions.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-sov-light-alt mt-4">
                {transactions.filter(t => t.status === 'Pending').length} pending approval
              </p>
            </div>

            <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sov-light-alt">Available Credit</p>
                  <p className="text-2xl font-bold text-sov-green">{formatCurrency(totalLimits - totalSpending)}</p>
                </div>
                <div className="w-12 h-12 bg-sov-green/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-sov-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-sov-light-alt mt-4">
                Across all active cards
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-sov-light mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-sov-dark rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-sov-light-alt" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sov-light">{transaction.merchantName}</p>
                      <p className="text-sm text-sov-light-alt">
                        {cards.find(c => c.id === transaction.cardId)?.assignedTo || 'Unknown Card'} • {transaction.transactionDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sov-light">{formatCurrency(transaction.amount)}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="mt-4 w-full bg-sov-dark border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              View All Transactions
            </button>
          </div>
        </div>
      )}

      {/* Card Management Tab */}
      {activeTab === 'cards' && (
        <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
          {/* Search and Filter Controls */}
          <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="cardSearch" className="block text-sm font-medium text-sov-light-alt mb-2">Search Cards</label>
                <input
                  type="text"
                  id="cardSearch"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by cardholder, card number..."
                  className="w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
                />
              </div>
              <div>
                <label htmlFor="cardTypeFilter" className="block text-sm font-medium text-sov-light-alt mb-2">Card Type</label>
                <select
                  id="cardTypeFilter"
                  value={filterCardType}
                  onChange={e => setFilterCardType(e.target.value)}
                  className="w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
                >
                  <option value="">All Types</option>
                  <option value="Virtual">Virtual</option>
                  <option value="Physical">Physical</option>
                  <option value="Fleet">Fleet</option>
                  <option value="Gas">Gas</option>
                </select>
              </div>
              <div>
                <label htmlFor="cardStatusFilter" className="block text-sm font-medium text-sov-light-alt mb-2">Status</label>
                <select
                  id="cardStatusFilter"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setIsNewCardModalOpen(true)}
                  className="w-full bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
                >
                  Issue New Card
                </button>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-sov-light">
                Company Cards ({filteredAndSortedCards.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAndSortedCards.map(card => (
                <div key={card.id} className="bg-sov-dark p-6 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-md flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{card.cardProvider}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sov-light">{card.assignedTo || 'Unassigned'}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-sov-light-alt font-mono">****-****-****-{card.cardNumber.last4}</p>
                          <button
                            onClick={() => handleRevealCard(card.id)}
                            className="text-sov-purple hover:text-sov-pink text-xs flex items-center gap-1 transition-colors"
                            title="Reveal full card number"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Reveal
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCardTypeColor(card.cardType)}`}>
                        {card.cardType}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(card.status)}`}>
                        {card.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-sov-light-alt">Monthly Spend</span>
                        <span className="text-sov-light">{formatCurrency(getCardMonthlySpend(card.id, transactions))} / {formatCurrency(card.monthlyLimit)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getUtilizationColor(getUtilizationPercentage(getCardMonthlySpend(card.id, transactions), card.monthlyLimit))}`}
                          style={{ width: `${getUtilizationPercentage(getCardMonthlySpend(card.id, transactions), card.monthlyLimit)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-sov-light-alt">Daily Limit</p>
                        <p className="text-sov-light font-semibold">{formatCurrency(card.dailyLimit)}</p>
                      </div>
                      <div>
                        <p className="text-sov-light-alt">Transaction Limit</p>
                        <p className="text-sov-light font-semibold">{formatCurrency(card.transactionLimit)}</p>
                      </div>
                    </div>

                    {card.lastActivity && (
                      <div className="text-sm">
                        <p className="text-sov-light-alt">Last Activity: {card.lastActivity}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mt-6 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => setSelectedCard(card)}
                      className="bg-sov-accent/20 text-sov-accent text-sm font-bold py-2 px-4 rounded-lg hover:bg-sov-accent/30 transition-colors"
                    >
                      View Details
                    </button>
                    {card.status === 'Active' ? (
                      <button
                        onClick={() => handleSuspendCard(card)}
                        className="bg-sov-red/20 text-sov-red text-sm font-bold py-2 px-4 rounded-lg hover:bg-sov-red/30 transition-colors"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateCard(card)}
                        className="bg-sov-green/20 text-sov-green text-sm font-bold py-2 px-4 rounded-lg hover:bg-sov-green/30 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 max-h-[700px] overflow-y-auto">
          <h3 className="text-xl font-semibold text-sov-light mb-4">All Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Card</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-sov-light">{transaction.transactionDate}</td>
                    <td className="p-3">
                      <div className="text-sov-light">{cards.find(c => c.id === transaction.cardId)?.assignedTo || 'Unknown'}</div>
                      <div className="text-sm text-sov-light-alt font-mono">
                        ****-****-****-{cards.find(c => c.id === transaction.cardId)?.cardNumber.last4}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sov-light">{transaction.merchantName}</div>
                      <div className="text-sm text-sov-light-alt">{transaction.location}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(transaction.merchantCategory)}`}>
                        {transaction.merchantCategory}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-sov-light">{formatCurrency(transaction.amount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleViewTransaction(transaction)}
                          className="bg-blue-500/20 text-blue-400 text-xs font-bold py-1 px-3 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          View
                        </button>
                        {transaction.status === 'Pending' && (
                          <>
                            <button 
                              onClick={() => handleFlagTransaction(transaction)}
                              className="bg-orange-500/20 text-orange-400 text-xs font-bold py-1 px-2 rounded-lg hover:bg-orange-500/30"
                              title="Flag for policy violation"
                            >
                              Flag
                            </button>
                            <button 
                              onClick={() => handleSubmitReimbursement(transaction)}
                              className="bg-sov-accent/20 text-sov-accent text-xs font-bold py-1 px-2 rounded-lg hover:bg-sov-accent/30"
                              title="Submit for reimbursement"
                            >
                              Reimburse
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card Details Modal */}
      <Modal isOpen={!!selectedCard && !isEditCardModalOpen} onClose={() => setSelectedCard(null)} title={`Card Details: ${selectedCard?.assignedTo}`} gradient="from-purple-500/20 to-purple-500/5">
        {selectedCard && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="grid grid-cols-2 gap-6">
              <ModalSection className="space-y-4">
                <div>
                  <ModalLabel>Card Number</ModalLabel>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-lg text-sov-light">****-****-****-{selectedCard.cardNumber.last4}</p>
                    <button
                      onClick={() => handleRevealCard(selectedCard.id)}
                      className="text-sov-purple hover:text-sov-pink text-xs flex items-center gap-1 transition-colors uppercase tracking-wider font-bold"
                      title="Reveal full card number"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Reveal
                    </button>
                  </div>
                </div>
                <ModalField label="Card Type" value={
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCardTypeColor(selectedCard.cardType)}`}>
                    {selectedCard.cardType}
                  </span>
                } />
                <ModalField label="Status" value={
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCard.status)}`}>
                    {selectedCard.status}
                  </span>
                } />
              </ModalSection>
              <ModalSection className="space-y-4">
                <ModalField label="Assigned To" value={selectedCard.assignedTo} />
                <ModalField label="Entity" value={selectedCard.assignedEntity} />
                <ModalField label="Expiration" value={<span className="font-mono">{selectedCard.expirationDate}</span>} />
              </ModalSection>
            </div>
            
            <ModalSection>
              <div className="grid grid-cols-3 gap-4">
                <ModalField label="Monthly Limit" value={<span className="text-lg font-semibold text-sov-light">{formatCurrency(selectedCard.monthlyLimit)}</span>} />
                <ModalField label="Daily Limit" value={<span className="text-lg font-semibold text-sov-light">{formatCurrency(selectedCard.dailyLimit)}</span>} />
                <ModalField label="Transaction Limit" value={<span className="text-lg font-semibold text-sov-light">{formatCurrency(selectedCard.transactionLimit)}</span>} />
              </div>
            </ModalSection>

            <ModalSection>
              <div className="grid grid-cols-3 gap-4">
                <ModalField label="This Month" value={<span className="text-lg font-semibold text-sov-light">{formatCurrency(selectedCard.spentThisMonth)}</span>} />
                <ModalField label="This Quarter" value={<span className="text-lg font-semibold text-sov-light">{formatCurrency(selectedCard.spentThisQuarter)}</span>} />
                <ModalField label="This Year" value={<span className="text-lg font-semibold text-sov-light">{formatCurrency(selectedCard.spentThisYear)}</span>} />
              </div>
            </ModalSection>

            {selectedCard.notes && (
              <ModalSection>
                <ModalField label="Notes" value={selectedCard.notes} />
              </ModalSection>
            )}
            
            <div className="flex justify-end pt-2">
                <ModalButton variant="secondary" onClick={() => setSelectedCard(null)}>Close</ModalButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction Details Modal - ENHANCED with Expense Tracking */}
      <Modal 
        isOpen={!!selectedTransaction} 
        onClose={() => {
          setSelectedTransaction(null);
          setApprovalComment('');
          setShowReceiptUpload(false);
          setReceiptFile(null);
        }} 
        title={`Transaction Details: ${selectedTransaction?.merchantName}`} 
        gradient="from-blue-500/20 to-blue-500/5"
      >
        {selectedTransaction && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <ModalSection className="space-y-4">
                <ModalField label="Merchant" value={selectedTransaction.merchantName} />
                <ModalField label="Category" value={
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(selectedTransaction.merchantCategory)}`}>
                    {selectedTransaction.merchantCategory}
                  </span>
                } />
                <ModalField label="Status" value={
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTransactionStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                } />
              </ModalSection>
              <ModalSection className="space-y-4">
                <ModalField label="Amount" value={<span className="text-lg font-bold text-sov-light">{formatCurrency(selectedTransaction.amount)}</span>} />
                <ModalField label="Transaction Date" value={selectedTransaction.transactionDate} />
                <ModalField label="Posting Date" value={selectedTransaction.postingDate || 'Pending'} />
              </ModalSection>
            </div>

            {/* NEW: Expense Tracking Section */}
            <ModalSection>
              <ModalSectionHeader>Expense Tracking & Compliance</ModalSectionHeader>
              
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <ModalLabel>Policy Violation</ModalLabel>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedTransaction.policyViolation ? 'bg-sov-red/20 text-sov-red' : 'bg-sov-green/20 text-sov-green'
                  }`}>
                    {selectedTransaction.policyViolation ? 'YES' : 'No'}
                  </span>
                  {selectedTransaction.policyViolationReason && (
                    <p className="text-xs text-sov-red mt-1">{selectedTransaction.policyViolationReason}</p>
                  )}
                </div>
                
                <div>
                  <ModalLabel>Reimbursement Status</ModalLabel>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sov-accent/20 text-sov-accent">
                    {selectedTransaction.reimbursementStatus || 'Not Submitted'}
                  </span>
                </div>
              </div>

              {selectedTransaction.approvedBy && (
                <div className="mt-3">
                  <ModalLabel>Approved By</ModalLabel>
                  <p className="text-sm text-sov-light">{selectedTransaction.approvedBy} {selectedTransaction.approvedAt && `on ${selectedTransaction.approvedAt}`}</p>
                </div>
              )}
            </ModalSection>

            {/* Receipt Section */}
            <ModalSection>
              <ModalSectionHeader>Receipt</ModalSectionHeader>
              {selectedTransaction.receiptUrl ? (
                <div className="flex items-center justify-between bg-sov-dark p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sov-green">📎</span>
                    <span className="text-sm text-sov-light">{selectedTransaction.receiptFileName || 'Receipt attached'}</span>
                  </div>
                  <a 
                    href={selectedTransaction.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-sov-accent/20 text-sov-accent px-3 py-1 rounded hover:bg-sov-accent/30"
                  >
                    View Receipt
                  </a>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setShowReceiptUpload(!showReceiptUpload)}
                    className="text-sm bg-sov-accent/20 text-sov-accent px-4 py-2 rounded-lg hover:bg-sov-accent/30"
                  >
                    {showReceiptUpload ? 'Cancel Upload' : 'Upload Receipt'}
                  </button>
                  
                  {showReceiptUpload && (
                    <div className="mt-3">
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="text-sm text-sov-light-alt"
                      />
                      <button
                        onClick={() => {
                          // In real app: upload to storage and update transaction
                          if (receiptFile) {
                            const fakeUrl = URL.createObjectURL(receiptFile);
                            // This would normally call updateCardTransaction
                            console.log('Receipt uploaded:', receiptFile.name);
                            alert('Receipt uploaded successfully (demo)');
                            setShowReceiptUpload(false);
                            setReceiptFile(null);
                          }
                        }}
                        disabled={!receiptFile}
                        className="ml-3 px-4 py-1 bg-sov-accent text-sov-dark text-sm rounded disabled:opacity-50"
                      >
                        Upload
                      </button>
                    </div>
                  )}
                </div>
              )}
            </ModalSection>

            {/* Approval Actions */}
            {selectedTransaction.status === 'Pending' && (
              <ModalSection>
                <ModalSectionHeader>Approval Actions</ModalSectionHeader>
                <div className="space-y-3">
                  <div>
                    <ModalLabel>Approval Comment (Optional)</ModalLabel>
                    <input
                      type="text"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="w-full bg-sov-dark border border-white/10 rounded-lg p-2 text-sm"
                      placeholder="Approved per policy..."
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // In real app: call update function
                        console.log('Approving transaction', selectedTransaction.id, approvalComment);
                        alert('Transaction approved (demo)');
                        setSelectedTransaction(null);
                      }}
                      className="flex-1 bg-sov-green/20 text-sov-green py-2 rounded-lg hover:bg-sov-green/30"
                    >
                      Approve Expense
                    </button>
                    
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection:');
                        if (reason) {
                          console.log('Rejecting transaction', selectedTransaction.id, reason);
                          alert('Transaction rejected (demo)');
                          setSelectedTransaction(null);
                        }
                      }}
                      className="flex-1 bg-sov-red/20 text-sov-red py-2 rounded-lg hover:bg-sov-red/30"
                    >
                      Reject Expense
                    </button>
                  </div>
                </div>
              </ModalSection>
            )}

            <div className="flex justify-end pt-2">
                <ModalButton variant="secondary" onClick={() => setSelectedTransaction(null)}>Close</ModalButton>
            </div>
          </div>
        )}
      </Modal>

      {/* New Card Modal */}
      <Modal 
        isOpen={isNewCardModalOpen} 
        onClose={() => {
          setIsNewCardModalOpen(false);
          resetForm();
        }} 
        title="Issue New Company Card"
        gradient="from-blue-500/20 to-blue-500/5"
      >
        <form onSubmit={handleAddCard} className="space-y-5 animate-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <ModalLabel htmlFor="newCardType">Card Type *</ModalLabel>
              <ModalSelect
                id="newCardType"
                value={cardType}
                onChange={e => setCardType(e.target.value as CompanyCard['cardType'])}
                required
              >
                <option value="Virtual">Virtual Card</option>
                <option value="Physical">Physical Card</option>
                <option value="Fleet">Fleet Card</option>
                <option value="Gas">Gas Card</option>
              </ModalSelect>
            </div>
            <div>
              <ModalLabel htmlFor="newCardProvider">Card Provider *</ModalLabel>
              <ModalSelect
                id="newCardProvider"
                value={cardProvider}
                onChange={e => setCardProvider(e.target.value as CompanyCard['cardProvider'])}
                required
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Amex">American Express</option>
                <option value="Discover">Discover</option>
              </ModalSelect>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <ModalLabel htmlFor="newAssignedTo">Assign To *</ModalLabel>
              <ModalInput
                type="text"
                id="newAssignedTo"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                required
                placeholder="Employee name or department"
              />
            </div>
            <div>
              <ModalLabel htmlFor="newAssignedEntity">Entity *</ModalLabel>
              <ModalSelect
                id="newAssignedEntity"
                value={assignedEntity}
                onChange={e => setAssignedEntity(e.target.value as Entity)}
                required
              >
                <option value={Entity.LLC}>{Entity.LLC}</option>
                <option value={Entity.Trust}>{Entity.Trust}</option>
              </ModalSelect>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <ModalLabel htmlFor="newMonthlyLimit">Monthly Limit *</ModalLabel>
              <ModalInput
                type="number"
                id="newMonthlyLimit"
                value={monthlyLimit}
                onChange={e => setMonthlyLimit(Number(e.target.value))}
                required
                min="0"
                step="100"
              />
            </div>
            <div>
              <ModalLabel htmlFor="newDailyLimit">Daily Limit *</ModalLabel>
              <ModalInput
                type="number"
                id="newDailyLimit"
                value={dailyLimit}
                onChange={e => setDailyLimit(Number(e.target.value))}
                required
                min="0"
                step="50"
              />
            </div>
            <div>
              <ModalLabel htmlFor="newTransactionLimit">Tx Limit *</ModalLabel>
              <ModalInput
                type="number"
                id="newTransactionLimit"
                value={transactionLimit}
                onChange={e => setTransactionLimit(Number(e.target.value))}
                required
                min="0"
                step="50"
              />
            </div>
          </div>

          <div className="col-span-2">
            <ModalLabel htmlFor="newBillingAddress">Billing Address *</ModalLabel>
            <ModalInput
              type="text"
              id="newBillingAddress"
              value={billingAddress}
              onChange={e => setBillingAddress(e.target.value)}
              required
            />
          </div>
          
          <div className="col-span-2">
            <ModalLabel htmlFor="newNotes">Notes</ModalLabel>
            <ModalTextarea
              id="newNotes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-6 space-x-3">
            <ModalButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsNewCardModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </ModalButton>
            <ModalButton type="submit">
              Issue Card
            </ModalButton>
          </div>
        </form>
      </Modal>

      {/* Card Reveal Modal */}
      <Modal isOpen={showRevealModal} onClose={() => setShowRevealModal(false)} title="Reveal Card Number">
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-sm font-medium text-yellow-400">Security Notice</h3>
            </div>
            <p className="mt-2 text-sm text-yellow-300">
              This action will reveal the full card number for security purposes. This access will be audited and the number will auto-hide after 60 seconds.
            </p>
          </div>

          <div>
             <ModalLabel htmlFor="revealReason">Reason for Access <span className="text-red-400">*</span></ModalLabel>
             <ModalSelect
               id="revealReason"
               value={revealReason}
               onChange={(e) => setRevealReason(e.target.value)}
             >
               <option value="">Select a reason...</option>
               <option value="Payment Processing">Payment Processing</option>
               <option value="Dispute Resolution">Dispute Resolution</option>
               <option value="Account Verification">Account Verification</option>
               <option value="Compliance Review">Compliance Review</option>
               <option value="Technical Support">Technical Support</option>
               <option value="Security Investigation">Security Investigation</option>
               <option value="Other">Other</option>
             </ModalSelect>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <ModalButton
              type="button"
              variant="secondary"
              onClick={() => setShowRevealModal(false)}
            >
              Cancel
            </ModalButton>
            <ModalButton
              type="button"
              onClick={submitCardReveal}
              disabled={!revealReason}
              variant="danger"
            >
              Reveal Card Number
            </ModalButton>
          </div>
        </div>
      </Modal>

      {/* Revealed Card Number Overlay */}
      {revealedCardData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-sov-dark-alt border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sov-red">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 className="text-lg font-semibold">Card Number Revealed</h3>
              </div>
              
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <p className="text-2xl font-mono text-sov-light tracking-wider">{revealedCardData.fullNumber}</p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => copyToClipboard(revealedCardData.fullNumber)}
                  className="flex items-center space-x-2 text-sov-purple hover:text-sov-pink transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </button>
                
                <div className="flex items-center space-x-2 text-yellow-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{revealTimeRemaining}s remaining</span>
                </div>
              </div>
              
              <button
                onClick={() => setRevealedCardData(null)}
                className="bg-sov-dark border border-gray-600 text-sov-light px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Hide Now
              </button>
              
              <p className="text-xs text-gray-400">
                Audit ID: {revealedCardData.auditId}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
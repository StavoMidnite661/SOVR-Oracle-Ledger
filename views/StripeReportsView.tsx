import React, { useState, useMemo } from 'react';
import { KpiCard } from '../components/shared/KpiCard.js';
import type { AchPayment, DirectDepositPayout, PaymentReconciliationEntry, StripeCustomer } from '../types.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Modal } from '../components/shared/Modal.js';
import { ModalInput, ModalLabel, ModalButton, ModalSection, ModalSectionHeader, ModalSelect } from '../components/shared/ModalElements.js';
import { 
  DollarSign, 
  Repeat as BankTransferIcon, 
  Target, 
  CreditCard, 
  Check, 
  Users, 
  FileText, 
  BarChart3, 
  Download 
} from 'lucide-react';

interface StripeReportsViewProps {
  achPayments?: AchPayment[];
  directDepositPayouts?: DirectDepositPayout[];
  reconciliationEntries?: PaymentReconciliationEntry[];
  customers?: StripeCustomer[];
}

type ReportsTab = 'payments' | 'reconciliation' | 'customers' | 'tax-regulatory' | 'analytics' | 'exports';

export const StripeReportsView: React.FC<StripeReportsViewProps> = ({
  achPayments = [],
  directDepositPayouts = [],
  reconciliationEntries = [],
  customers = [],
}) => {
  const [activeTab, setActiveTab] = useState<ReportsTab>('payments');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedPaymentType, setSelectedPaymentType] = useState<'all' | 'ach' | 'direct-deposit'>('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');

  // Calculate report metrics
  const reportMetrics = useMemo(() => {
    const successfulPayments = achPayments.filter(payment => payment.status === 'succeeded');
    const totalPaymentVolume = successfulPayments.reduce((sum, payment) => sum + payment.amountCents / 100, 0);
    const averagePaymentSize = successfulPayments.length > 0 ? totalPaymentVolume / successfulPayments.length : 0;
    const successRate = achPayments.length > 0 ? (successfulPayments.length / achPayments.length) * 100 : 0;
    
    const totalDirectDepositVolume = directDepositPayouts
      .filter(payout => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amountCents / 100, 0);

    const totalFees = reconciliationEntries
      .filter(entry => entry.type === 'charge')
      .reduce((sum, entry) => sum + entry.feeCents / 100, 0);

    return {
      totalPaymentVolume,
      totalDirectDepositVolume,
      averagePaymentSize,
      successRate,
      totalFees,
      paymentCount: achPayments.length,
      activeCustomers: customers.filter(c => c.active).length,
    };
  }, [achPayments, directDepositPayouts, reconciliationEntries, customers]);

  // Chart data for payment trends
  const paymentTrendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const dayPayments = achPayments.filter(payment => 
        new Date(payment.createdAt).toISOString().split('T')[0] === date && payment.status === 'succeeded'
      );
      const dayVolume = dayPayments.reduce((sum, payment) => sum + payment.amountCents / 100, 0);
      const dayCount = dayPayments.length;

      return {
        date,
        day: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: dayVolume,
        count: dayCount,
      };
    });
  }, [achPayments]);

  // Customer analysis data
  const customerAnalysisData = useMemo(() => {
    const topCustomers = customers
      .map(customer => {
        const customerPayments = achPayments.filter(payment => payment.customerId === customer.id);
        const totalSpent = customerPayments
          .filter(payment => payment.status === 'succeeded')
          .reduce((sum, payment) => sum + payment.amountCents / 100, 0);
        
        return {
          name: `${customer.firstName} ${customer.lastName}`,
          totalSpent,
          paymentCount: customerPayments.length,
          lastPayment: customerPayments.length > 0 
            ? Math.max(...customerPayments.map(p => new Date(p.createdAt).getTime()))
            : null,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return topCustomers;
  }, [customers, achPayments]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const methodCounts = achPayments.reduce((acc, payment) => {
      const method = payment.achClassCode || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([method, count]) => ({
      name: method,
      value: count,
    }));
  }, [achPayments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const COLORS = ['#2dd4bf', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  const exportReport = (format: 'csv' | 'pdf' | 'excel') => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeframe: dateRange,
      format,
      metrics: reportMetrics,
      data: {
        payments: achPayments,
        customers: customerAnalysisData,
        trends: paymentTrendData,
      },
    };

    // In a real implementation, this would generate the actual export
    console.log(`Exporting ${format} report:`, reportData);
    setIsExportModalOpen(false);
    alert(`${format.toUpperCase()} report exported successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-sov-light">Stripe Reports & Analytics</h1>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-sov-dark-alt border border-gray-600 rounded-lg px-3 py-2 text-sov-light"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Payment Volume"
          value={formatCurrency(reportMetrics.totalPaymentVolume)}
          icon={<DollarSign />}
          trend="+15.3%"
          trendDirection="up"
        />
        <KpiCard
          title="Direct Deposit Volume"
          value={formatCurrency(reportMetrics.totalDirectDepositVolume)}
          icon={<BankTransferIcon />}
          trend="+8.7%"
          trendDirection="up"
        />
        <KpiCard
          title="Success Rate"
          value={`${Math.round(reportMetrics.successRate)}%`}
          icon={<Target />}
          trend={reportMetrics.successRate >= 95 ? "Excellent" : "Monitor"}
          trendDirection={reportMetrics.successRate >= 95 ? "up" : "neutral"}
        />
        <KpiCard
          title="Processing Fees"
          value={formatCurrency(reportMetrics.totalFees)}
          icon={<CreditCard />}
          trend="+2.1%"
          trendDirection="neutral"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg p-1 border border-gray-700">
        <nav className="flex space-x-1 flex-wrap">
          {[
            { id: 'payments', label: 'Payment Reports', icon: <DollarSign size={18} /> },
            { id: 'reconciliation', label: 'Reconciliation', icon: <Check size={18} /> },
            { id: 'customers', label: 'Customer Reports', icon: <Users size={18} /> },
            { id: 'tax-regulatory', label: 'Tax & Regulatory', icon: <FileText size={18} /> },
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
            { id: 'exports', label: 'Scheduled Exports', icon: <Download size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportsTab)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                activeTab === tab.id
                  ? 'bg-sov-accent text-sov-dark'
                  : 'text-sov-light hover:bg-sov-dark hover:text-sov-accent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 max-h-[600px] overflow-y-auto">
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">Payment Reports</h3>
              <select
                value={selectedPaymentType}
                onChange={(e) => setSelectedPaymentType(e.target.value as any)}
                className="bg-sov-dark-alt border border-gray-600 rounded-lg px-3 py-2 text-sov-light"
              >
                <option value="all">All Payment Types</option>
                <option value="ach">ACH Payments Only</option>
                <option value="direct-deposit">Direct Deposits Only</option>
              </select>
            </div>

            {/* Payment Trend Chart */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Payment Volume Trend</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={paymentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                    formatter={(value, name) => [
                      name === 'volume' ? formatCurrency(value as number) : value,
                      name === 'volume' ? 'Volume' : 'Transaction Count'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="volume" name="Volume" stroke="#2dd4bf" strokeWidth={2} />
                  <Line type="monotone" dataKey="count" name="Count" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Summary Table */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Payment Summary</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-3">Date</th>
                      <th className="p-3">Payment ID</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {achPayments.slice(0, 10).map((payment) => {
                      const customer = customers.find(c => c.id === payment.customerId);
                      return (
                        <tr key={payment.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3 text-sov-light-alt">{formatDate(payment.createdAt)}</td>
                          <td className="p-3 font-mono text-sm text-sov-light-alt">{payment.id.slice(0, 8)}...</td>
                          <td className="p-3 font-semibold text-sov-light">{formatCurrency(payment.amountCents / 100)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              payment.status === 'succeeded' ? 'bg-sov-green/20 text-sov-green' :
                              payment.status === 'pending' ? 'bg-sov-yellow/20 text-sov-yellow' :
                              'bg-sov-red/20 text-sov-red'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="p-3 text-sov-light-alt">{payment.achClassCode}</td>
                          <td className="p-3 text-sov-light">
                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Financial Reconciliation</h3>

            {/* Reconciliation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-2">Total Reconciled</h4>
                <p className="text-2xl font-bold text-sov-green">
                  {formatCurrency(reconciliationEntries.reduce((sum, entry) => sum + entry.netCents / 100, 0))}
                </p>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-2">Total Fees</h4>
                <p className="text-2xl font-bold text-sov-yellow">
                  {formatCurrency(reconciliationEntries.reduce((sum, entry) => sum + entry.feeCents / 100, 0))}
                </p>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-2">Outstanding</h4>
                <p className="text-2xl font-bold text-sov-red">
                  {formatCurrency(
                    reconciliationEntries
                      .filter(entry => !entry.reconciledAt)
                      .reduce((sum, entry) => sum + entry.netCents / 100, 0)
                  )}
                </p>
              </div>
            </div>

            {/* Reconciliation Entries */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Reconciliation Entries</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-3">Date</th>
                      <th className="p-3">Transaction ID</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Fees</th>
                      <th className="p-3">Net</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliationEntries.slice(0, 10).map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3 text-sov-light-alt">{formatDate(entry.createdAt)}</td>
                        <td className="p-3 font-mono text-sm text-sov-light-alt">
                          {entry.stripeBalanceTransactionId?.slice(0, 8) || 'N/A'}...
                        </td>
                        <td className="p-3 font-semibold text-sov-light">{formatCurrency(entry.amountCents / 100)}</td>
                        <td className="p-3 text-sov-yellow">{formatCurrency(entry.feeCents / 100)}</td>
                        <td className="p-3 text-sov-green font-semibold">{formatCurrency(entry.netCents / 100)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            entry.reconciledAt ? 'bg-sov-green/20 text-sov-green' : 'bg-sov-yellow/20 text-sov-yellow'
                          }`}>
                            {entry.reconciledAt ? 'Reconciled' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Customer Payment Reports</h3>

            {/* Customer Analysis Chart */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Top Customers by Volume</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                    formatter={(value) => [formatCurrency(value as number), 'Total Spent']}
                  />
                  <Bar dataKey="totalSpent" fill="#2dd4bf" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Details Table */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Customer Payment Summary</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-3">Customer</th>
                      <th className="p-3">Total Spent</th>
                      <th className="p-3">Payment Count</th>
                      <th className="p-3">Avg Payment</th>
                      <th className="p-3">Last Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerAnalysisData.map((customer, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3 text-sov-light">{customer.name}</td>
                        <td className="p-3 font-semibold text-sov-light">{formatCurrency(customer.totalSpent)}</td>
                        <td className="p-3 text-sov-light">{customer.paymentCount}</td>
                        <td className="p-3 text-sov-light-alt">
                          {formatCurrency(customer.paymentCount > 0 ? customer.totalSpent / customer.paymentCount : 0)}
                        </td>
                        <td className="p-3 text-sov-light-alt">
                          {customer.lastPayment ? formatDate(new Date(customer.lastPayment)) : 'No payments'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax-regulatory' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Tax & Regulatory Reports</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">1099-K Reporting</h4>
                <p className="text-sov-light-alt mb-4">
                  Generate 1099-K forms for payment processors with $600+ in gross volume.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sov-light">Eligible Payees:</span>
                    <span className="text-sov-light font-semibold">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sov-light">Total Gross Volume:</span>
                    <span className="text-sov-light font-semibold">{formatCurrency(156750)}</span>
                  </div>
                  <button className="w-full bg-sov-accent/10 text-sov-accent font-bold py-2 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors">
                    Generate 1099-K Forms
                  </button>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">NACHA Compliance Report</h4>
                <p className="text-sov-light-alt mb-4">
                  Monthly ACH compliance report for regulatory requirements.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sov-light">ACH Entries Processed:</span>
                    <span className="text-sov-light font-semibold">{achPayments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sov-light">Return Rate:</span>
                    <span className="text-sov-light font-semibold">2.3%</span>
                  </div>
                  <button className="w-full bg-sov-blue/10 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/20 transition-colors">
                    Generate NACHA Report
                  </button>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">AML Reporting</h4>
                <p className="text-sov-light-alt mb-4">
                  Suspicious activity and cash transaction reports.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sov-light">SARs Filed:</span>
                    <span className="text-sov-light font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sov-light">CTR Requirements:</span>
                    <span className="text-sov-light font-semibold">Met</span>
                  </div>
                  <button className="w-full bg-sov-green/10 text-sov-green font-bold py-2 px-4 rounded-lg hover:bg-sov-green/20 transition-colors">
                    Generate AML Report
                  </button>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">State Tax Reporting</h4>
                <p className="text-sov-light-alt mb-4">
                  Sales tax and financial transaction tax reporting by state.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sov-light">States with Activity:</span>
                    <span className="text-sov-light font-semibold">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sov-light">Estimated Tax Due:</span>
                    <span className="text-sov-light font-semibold">{formatCurrency(2847)}</span>
                  </div>
                  <button className="w-full bg-sov-yellow/10 text-sov-yellow font-bold py-2 px-4 rounded-lg hover:bg-sov-yellow/20 transition-colors">
                    Generate Tax Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Payment Analytics</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Method Distribution */}
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Payment Method Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Success Rate Trend */}
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Performance Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Average Processing Time</span>
                    <span className="text-sov-light font-semibold">2.3 seconds</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Failed Payment Rate</span>
                    <span className="text-sov-light font-semibold">{(100 - reportMetrics.successRate).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Chargeback Rate</span>
                    <span className="text-sov-light font-semibold">0.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Customer Satisfaction</span>
                    <span className="text-sov-light font-semibold">4.8/5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Detailed Analytics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-sov-accent">{Math.round(reportMetrics.averagePaymentSize)}</p>
                  <p className="text-sov-light-alt">Average Payment Size</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-sov-blue">{reportMetrics.paymentCount}</p>
                  <p className="text-sov-light-alt">Total Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-sov-green">{reportMetrics.activeCustomers}</p>
                  <p className="text-sov-light-alt">Active Customers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">Scheduled Exports</h3>
              <button className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                Create Schedule
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Daily Reports</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-sov-dark-alt rounded-lg">
                    <div>
                      <p className="font-semibold text-sov-light">Daily Payment Summary</p>
                      <p className="text-sov-light-alt text-sm">Daily at 6:00 AM UTC</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-sov-green/20 text-sov-green px-2 py-1 rounded-full text-xs font-semibold">Active</span>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">Edit</button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-sov-dark-alt rounded-lg">
                    <div>
                      <p className="font-semibold text-sov-light">Reconciliation Report</p>
                      <p className="text-sov-light-alt text-sm">Daily at 11:59 PM UTC</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-sov-green/20 text-sov-green px-2 py-1 rounded-full text-xs font-semibold">Active</span>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">Edit</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Weekly Reports</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-sov-dark-alt rounded-lg">
                    <div>
                      <p className="font-semibold text-sov-light">Customer Activity Report</p>
                      <p className="text-sov-light-alt text-sm">Every Monday at 9:00 AM UTC</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-sov-green/20 text-sov-green px-2 py-1 rounded-full text-xs font-semibold">Active</span>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">Edit</button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-sov-dark-alt rounded-lg">
                    <div>
                      <p className="font-semibold text-sov-light">Compliance Summary</p>
                      <p className="text-sov-light-alt text-sm">Every Friday at 5:00 PM UTC</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-sov-yellow/20 text-sov-yellow px-2 py-1 rounded-full text-xs font-semibold">Paused</span>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">Edit</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Monthly Reports</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-sov-dark-alt rounded-lg">
                    <div>
                      <p className="font-semibold text-sov-light">Tax Reporting</p>
                      <p className="text-sov-light-alt text-sm">1st of each month at 12:00 AM UTC</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-sov-green/20 text-sov-green px-2 py-1 rounded-full text-xs font-semibold">Active</span>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">Edit</button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-sov-dark-alt rounded-lg">
                    <div>
                      <p className="font-semibold text-sov-light">Annual Statement</p>
                      <p className="text-sov-light-alt text-sm">December 31st at 11:59 PM UTC</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-sov-green/20 text-sov-green px-2 py-1 rounded-full text-xs font-semibold">Active</span>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">Edit</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Export Report">
        <div className="space-y-6">
          <ModalSection>
            <ModalSectionHeader>Export Configuration</ModalSectionHeader>
            <div className="space-y-4">
              <div>
                <ModalLabel htmlFor="exportFormat">Format</ModalLabel>
                <ModalSelect 
                  id="exportFormat"
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value as any)}
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </ModalSelect>
              </div>
              <div>
                <ModalLabel htmlFor="dateRange">Date Range</ModalLabel>
                <ModalSelect 
                  id="dateRange"
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value as any)}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </ModalSelect>
              </div>
              <div>
                <ModalLabel>Include Data</ModalLabel>
                <div className="space-y-3 mt-2">
                  <label className="flex items-center text-sov-light cursor-pointer">
                    <input type="checkbox" defaultChecked className="mr-3 h-4 w-4 bg-sov-dark border-gray-600 rounded focus:ring-sov-accent text-sov-accent" />
                    <span>Payment details</span>
                  </label>
                  <label className="flex items-center text-sov-light cursor-pointer">
                    <input type="checkbox" defaultChecked className="mr-3 h-4 w-4 bg-sov-dark border-gray-600 rounded focus:ring-sov-accent text-sov-accent" />
                    <span>Customer information</span>
                  </label>
                  <label className="flex items-center text-sov-light cursor-pointer">
                    <input type="checkbox" className="mr-3 h-4 w-4 bg-sov-dark border-gray-600 rounded focus:ring-sov-accent text-sov-accent" />
                    <span>Reconciliation data</span>
                  </label>
                </div>
              </div>
            </div>
          </ModalSection>
          
          <div className="flex justify-end pt-2 space-x-3">
            <ModalButton variant="secondary" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </ModalButton>
            <ModalButton onClick={() => exportReport(exportFormat)}>
              Export {exportFormat.toUpperCase()}
            </ModalButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};


// Icon components
const TargetIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BarChartIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
import React, { useState, useMemo } from 'react';
import { KpiCard } from '../components/shared/KpiCard.js';
import type { AchPayment, DirectDepositPayout, StripeCustomer } from '../types.js';
import { Modal } from '../components/shared/Modal.js';

interface StripePaymentsViewProps {
  customers?: StripeCustomer[];
  achPayments?: AchPayment[];
  directDepositPayouts?: DirectDepositPayout[];
  onCreateCustomer?: (customer: Omit<StripeCustomer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCreateAchPayment?: (payment: Omit<AchPayment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCreateDirectDepositPayout?: (payout: Omit<DirectDepositPayout, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

type PaymentsTab = 'overview' | 'ach-payments' | 'direct-deposits' | 'customers' | 'activity';

import { 
  CreditCard, 
  ArrowRightLeft, 
  Users, 
  Clock, 
  LayoutDashboard, 
  Activity,
  AlertCircle
} from 'lucide-react';

const CreditCardIcon = () => <CreditCard />;
const BankTransferIcon = () => <ArrowRightLeft />;
const UsersIcon = () => <Users />;
const ClockIcon = () => <Clock />;
const DashboardIcon = () => <LayoutDashboard />;
const ActivityIcon = () => <Activity />;
const AlertCircleIcon = () => <AlertCircle />;

export const StripePaymentsView: React.FC<StripePaymentsViewProps> = ({
  customers = [],
  achPayments = [],
  directDepositPayouts = [],
  onCreateCustomer,
  onCreateAchPayment,
  onCreateDirectDepositPayout,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentsTab>('overview');
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
  const [isCreateAchPaymentModalOpen, setIsCreateAchPaymentModalOpen] = useState(false);
  const [isCreateDirectDepositModalOpen, setIsCreateDirectDepositModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<StripeCustomer | null>(null);

  // Calculate overview metrics
  const paymentMetrics = useMemo(() => {
    const totalAchVolume = achPayments
      .filter(payment => payment.status === 'succeeded')
      .reduce((sum, payment) => sum + payment.amountCents / 100, 0);

    const totalDirectDepositVolume = directDepositPayouts
      .filter(payout => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amountCents / 100, 0);

    const totalCustomers = customers.filter(customer => customer.active).length;
    const pendingPayments = achPayments.filter(payment => payment.status === 'pending').length;

    return {
      totalAchVolume,
      totalDirectDepositVolume,
      totalCustomers,
      pendingPayments,
    };
  }, [customers, achPayments, directDepositPayouts]);

  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'ACH Payment' | 'Direct Deposit' | 'Customer Created' | 'Payment Failed';
      description: string;
      amount?: number;
      date: string;
      status: 'success' | 'pending' | 'failed';
      customer?: string;
    }> = [];

    // Add recent ACH payments
    achPayments.slice(0, 5).forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      activities.push({
        id: payment.id,
        type: 'ACH Payment',
        description: payment.description || 'ACH Payment',
        amount: payment.amountCents / 100,
        date: new Date(payment.createdAt).toISOString().split('T')[0],
        status: payment.status === 'succeeded' ? 'success' : payment.status === 'pending' ? 'pending' : 'failed',
        customer: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer',
      });
    });

    // Add recent direct deposits
    directDepositPayouts.slice(0, 3).forEach(payout => {
      activities.push({
        id: payout.id,
        type: 'Direct Deposit',
        description: payout.description || 'Direct Deposit Payout',
        amount: payout.amountCents / 100,
        date: new Date(payout.createdAt).toISOString().split('T')[0],
        status: payout.status === 'paid' ? 'success' : payout.status === 'pending' ? 'pending' : 'failed',
        customer: 'Employee',
      });
    });

    // Sort by date
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [customers, achPayments, directDepositPayouts]);

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

  const getStatusBadge = (status: string) => {
    const statusColors = {
      success: 'bg-sov-green/20 text-sov-green',
      pending: 'bg-sov-yellow/20 text-sov-yellow',
      failed: 'bg-sov-red/20 text-sov-red',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-400'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-sov-light">Stripe Payments</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCreateCustomerModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            New Customer
          </button>
          <button
            onClick={() => setIsCreateAchPaymentModalOpen(true)}
            className="bg-sov-green/20 text-sov-green font-bold py-2 px-4 rounded-lg hover:bg-sov-green/30 transition-colors border border-sov-green/30"
          >
            New ACH Payment
          </button>
          <button
            onClick={() => setIsCreateDirectDepositModalOpen(true)}
            className="bg-sov-blue/20 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/30 transition-colors border border-sov-blue/30"
          >
            New Direct Deposit
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total ACH Volume"
          value={formatCurrency(paymentMetrics.totalAchVolume)}
          icon={<CreditCardIcon />}
          change="+12.5%"
          changeType="increase"
        />
        <KpiCard
          title="Direct Deposits"
          value={formatCurrency(paymentMetrics.totalDirectDepositVolume)}
          icon={<BankTransferIcon />}
          change="+8.3%"
          changeType="increase"
        />
        <KpiCard
          title="Active Customers"
          value={paymentMetrics.totalCustomers.toString()}
          icon={<UsersIcon />}
          change="Real-time"
        />
        <KpiCard
          title="Pending Payments"
          value={paymentMetrics.pendingPayments.toString()}
          icon={<ClockIcon />}
          change={paymentMetrics.pendingPayments > 0 ? "Caution" : "Stable"}
          changeType={paymentMetrics.pendingPayments > 0 ? "decrease" : "increase"}
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg p-1 border border-gray-700">
        <nav className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
            { id: 'ach-payments', label: 'ACH Payments', icon: <CreditCardIcon /> },
            { id: 'direct-deposits', label: 'Direct Deposits', icon: <BankTransferIcon /> },
            { id: 'customers', label: 'Customers', icon: <UsersIcon /> },
            { id: 'activity', label: 'Activity', icon: <ActivityIcon /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as PaymentsTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Payment Overview</h3>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-accent cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sov-green/20 rounded-lg">
                    <CreditCardIcon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sov-light">Process ACH Payment</h4>
                    <p className="text-sm text-sov-light-alt">Send ACH payments to customers</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-blue cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sov-blue/20 rounded-lg">
                    <BankTransferIcon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sov-light">Direct Deposit</h4>
                    <p className="text-sm text-sov-light-alt">Process payroll direct deposits</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-gold cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sov-gold/20 rounded-lg">
                    <UsersIcon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sov-light">Manage Customers</h4>
                    <p className="text-sm text-sov-light-alt">Add and manage customer accounts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div>
              <h4 className="text-lg font-semibold text-sov-light mb-4">Recent Activity</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity) => (
                      <tr key={activity.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {activity.type === 'ACH Payment' && <CreditCardIcon />}
                            {activity.type === 'Direct Deposit' && <BankTransferIcon />}
                            {activity.type === 'Customer Created' && <UsersIcon />}
                            {activity.type === 'Payment Failed' && <AlertCircleIcon />}
                            <span className="text-sm text-sov-light-alt">{activity.type}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sov-light">{activity.description}</td>
                        <td className="p-3 text-sov-light-alt">{activity.customer || '-'}</td>
                        <td className="p-3 font-semibold text-sov-light">
                          {activity.amount ? formatCurrency(activity.amount) : '-'}
                        </td>
                        <td className="p-3 text-sov-light-alt">{formatDate(activity.date)}</td>
                        <td className="p-3">{getStatusBadge(activity.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ach-payments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">ACH Payments</h3>
              <button
                onClick={() => setIsCreateAchPaymentModalOpen(true)}
                className="bg-sov-green/20 text-sov-green font-bold py-2 px-4 rounded-lg hover:bg-sov-green/30 transition-colors border border-sov-green/30"
              >
                New ACH Payment
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3">Payment ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Settlement Date</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {achPayments.slice(0, 10).map((payment) => {
                    const customer = customers.find(c => c.id === payment.customerId);
                    return (
                      <tr key={payment.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3 font-mono text-sm text-sov-light-alt">{payment.id.slice(0, 8)}...</td>
                        <td className="p-3 text-sov-light">
                          {customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown'}
                        </td>
                        <td className="p-3 font-semibold text-sov-light">{formatCurrency(payment.amountCents / 100)}</td>
                        <td className="p-3">{getStatusBadge(payment.status)}</td>
                        <td className="p-3 text-sov-light-alt">
                          {payment.actualSettlementDate ? formatDate(payment.actualSettlementDate) : 'Pending'}
                        </td>
                        <td className="p-3">
                          <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'direct-deposits' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">Direct Deposits</h3>
              <button
                onClick={() => setIsCreateDirectDepositModalOpen(true)}
                className="bg-sov-blue/20 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/30 transition-colors border border-sov-blue/30"
              >
                New Direct Deposit
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3">Payout ID</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Arrival Date</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {directDepositPayouts.slice(0, 10).map((payout) => (
                    <tr key={payout.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3 font-mono text-sm text-sov-light-alt">{payout.id.slice(0, 8)}...</td>
                      <td className="p-3 text-sov-light">Employee</td>
                      <td className="p-3 font-semibold text-sov-light">{formatCurrency(payout.amountCents / 100)}</td>
                      <td className="p-3">{getStatusBadge(payout.status === 'paid' ? 'success' : payout.status)}</td>
                      <td className="p-3 text-sov-light-alt">
                        {payout.estimatedArrivalDate ? formatDate(payout.estimatedArrivalDate) : 'Pending'}
                      </td>
                      <td className="p-3">
                        <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">Customers</h3>
              <button
                onClick={() => setIsCreateCustomerModalOpen(true)}
                className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
              >
                Add Customer
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 10).map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3 text-sov-light">{customer.firstName} {customer.lastName}</td>
                      <td className="p-3 text-sov-light-alt">{customer.email}</td>
                      <td className="p-3 text-sov-light-alt">{customer.phone || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer.active ? 'bg-sov-green/20 text-sov-green' : 'bg-gray-500/20 text-gray-400'}`}>
                          {customer.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-sov-light-alt">{formatDate(customer.createdAt)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-sov-accent hover:text-sov-accent-hover transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-sov-light">Activity Log</h3>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {activity.type === 'ACH Payment' && <CreditCardIcon />}
                      {activity.type === 'Direct Deposit' && <BankTransferIcon />}
                      {activity.type === 'Customer Created' && <UsersIcon />}
                      {activity.type === 'Payment Failed' && <AlertCircleIcon />}
                      <div>
                        <p className="font-semibold text-sov-light">{activity.description}</p>
                        <p className="text-sm text-sov-light-alt">{activity.customer || 'System'} • {formatDate(activity.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {activity.amount && (
                        <span className="font-semibold text-sov-light">{formatCurrency(activity.amount)}</span>
                      )}
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals would go here - simplified for brevity */}
    </div>
  );
};

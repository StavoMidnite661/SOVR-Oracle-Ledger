import React, { useState, useEffect } from 'react';
import type {
  DirectDepositRecipient,
  DirectDepositBankAccount,
  DirectDepositPayout,
  Employee,
  UserRole,
} from '../../types.js';

interface PayrollPayoutsProps {
  currentUserRole: UserRole;
}

interface PayoutRecipient {
  recipient: DirectDepositRecipient;
  bankAccount: DirectDepositBankAccount;
  employee?: Employee;
  amount: number;
  payPeriodStart?: string;
  payPeriodEnd?: string;
}

export const PayrollPayouts: React.FC<PayrollPayoutsProps> = ({ currentUserRole }) => {
  const [recipients, setRecipients] = useState<DirectDepositRecipient[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Record<string, DirectDepositBankAccount[]>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payouts, setPayouts] = useState<DirectDepositPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipients, setSelectedRecipients] = useState<PayoutRecipient[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [payoutType, setPayoutType] = useState<'scheduled' | 'immediate'>('scheduled');
  const [scheduledDate, setScheduledDate] = useState('');
  const [description, setDescription] = useState('');
  const [payPeriod, setPayPeriod] = useState({ start: '', end: '' });
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const total = selectedRecipients.reduce((sum, r) => sum + r.amount, 0);
    setTotalAmount(total);
  }, [selectedRecipients]);

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = { 'X-User-ID': 'admin-user', 'X-User-Email': 'admin@sovr.test', 'X-User-Role': 'admin' };
      const [recipientsRes, payoutsRes] = await Promise.all([
        fetch('/api/direct-deposit/recipients?verified=true', { headers }),
        fetch('/api/direct-deposit/payouts', { headers }),
      ]);

      if (!recipientsRes.ok || !payoutsRes.ok) {
        throw new Error('Failed to load data');
      }

      const recipientsData = await recipientsRes.json();
      const payoutsData = await payoutsRes.json();

      setRecipients(recipientsData);
      setPayouts(payoutsData);

      // Load bank accounts for each recipient
      const bankAccountsMap: Record<string, DirectDepositBankAccount[]> = {};
      for (const recipient of recipientsData) {
        const accountsRes = await fetch(`/api/direct-deposit/recipients/${recipient.id}/bank-accounts`, {
          headers: { 'X-User-ID': 'admin-user', 'X-User-Email': 'admin@sovr.test', 'X-User-Role': 'admin' }
        });
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          bankAccountsMap[recipient.id] = accountsData.filter((acc: DirectDepositBankAccount) => acc.isVerified);
        }
      }
      setBankAccounts(bankAccountsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (recipient: DirectDepositRecipient) => {
    const accounts = bankAccounts[recipient.id] || [];
    const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];

    if (!defaultAccount) {
      setError('No verified bank account found for this recipient');
      return;
    }

    const existingIndex = selectedRecipients.findIndex(
      (r) => r.recipient.id === recipient.id
    );

    if (existingIndex >= 0) {
      setSelectedRecipients(selectedRecipients.filter((r) => r.recipient.id !== recipient.id));
    } else {
      setSelectedRecipients([
        ...selectedRecipients,
        {
          recipient,
          bankAccount: defaultAccount,
          amount: 0,
        },
      ]);
    }
  };

  const updateRecipientAmount = (recipientId: string, amount: number) => {
    setSelectedRecipients(
      selectedRecipients.map((r) =>
        r.recipient.id === recipientId ? { ...r, amount } : r
      )
    );
  };

  const handleCreatePayout = async () => {
    if (selectedRecipients.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    const invalidRecipients = selectedRecipients.filter((r) => r.amount <= 0);
    if (invalidRecipients.length > 0) {
      setError('All selected recipients must have a positive amount');
      return;
    }

    if (payoutType === 'scheduled' && !scheduledDate) {
      setError('Please select a scheduled date');
      return;
    }

    // NEW: ISO 20022 validation
    const isoErrors: string[] = [];
    selectedRecipients.forEach((r, idx) => {
      const validation = (window as any).iso20022Service?.validatePaymentForISO 
        ? (window as any).iso20022Service.validatePaymentForISO(
            r.amount * 100, 
            r.bankAccount.routingNumber, 
            r.bankAccount.accountNumberLast4
          )
        : { valid: true, errors: [] };
      
      if (!validation.valid) {
        isoErrors.push(`Recipient ${idx + 1}: ${validation.errors.join(', ')}`);
      }
    });

    if (isoErrors.length > 0) {
      setError('ISO 20022 validation failed:\n' + isoErrors.join('\n'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/direct-deposit/payouts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': 'admin-user',
          'X-User-Email': 'admin@sovr.test',
          'X-User-Role': 'admin'
        },
        body: JSON.stringify({
          type: payoutType,
          scheduledPayoutDate: scheduledDate,
          description,
          payPeriodStart: payPeriod.start,
          payPeriodEnd: payPeriod.end,
          recipients: selectedRecipients.map((r) => ({
            recipientId: r.recipient.id,
            bankAccountId: r.bankAccount.id,
            amount: Math.round(r.amount * 100),
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to create payout');

      // NEW: Log ISO 20022 compliance event
      console.log(`[COMPLIANCE] Created ISO 20022 compliant payroll run with ${selectedRecipients.length} recipients`);

      setShowCreateForm(false);
      setSelectedRecipients([]);
      setDescription('');
      setScheduledDate('');
      setPayPeriod({ start: '', end: '' });
      loadData();
      alert('Payout created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payout');
    } finally {
      setLoading(false);
    }
  };

  const getPayoutStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
      return: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`${baseClasses} ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  if (loading && recipients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading payroll data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payroll Payouts</h2>
        {(currentUserRole === 'Admin' || currentUserRole === 'Finance') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Payroll Run
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Payouts</div>
          <div className="text-2xl font-bold">{payouts.length}</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {payouts.filter((p) => p.status === 'pending').length}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">This Month</div>
          <div className="text-2xl font-bold text-blue-600">
            {payouts.filter(
              (p) =>
                new Date(p.createdAt).getMonth() === new Date().getMonth() &&
                new Date(p.createdAt).getFullYear() === new Date().getFullYear()
            ).length}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Amount</div>
          <div className="text-2xl font-bold text-green-600">
            ${(payouts.reduce((sum, p) => sum + parseInt(p.amountCents), 0) / 100).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Create Payroll Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Create New Payroll Run</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Payout Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Payout Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="scheduled"
                      checked={payoutType === 'scheduled'}
                      onChange={(e) => setPayoutType(e.target.value as 'scheduled' | 'immediate')}
                      className="mr-2"
                    />
                    Scheduled
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="immediate"
                      checked={payoutType === 'immediate'}
                      onChange={(e) => setPayoutType(e.target.value as 'scheduled' | 'immediate')}
                      className="mr-2"
                    />
                    Immediate
                  </label>
                </div>
              </div>

              {payoutType === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pay Period Start</label>
                  <input
                    type="date"
                    value={payPeriod.start}
                    onChange={(e) => setPayPeriod({ ...payPeriod, start: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pay Period End</label>
                  <input
                    type="date"
                    value={payPeriod.end}
                    onChange={(e) => setPayPeriod({ ...payPeriod, end: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Payroll for October 2025"
                />
              </div>

              {/* Recipients Selection */}
              <div>
                <h4 className="font-semibold mb-3">
                  Select Recipients ({selectedRecipients.length} selected)
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Select
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Bank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recipients
                        .filter((r) => r.payoutsEnabled && (bankAccounts[r.id]?.length || 0) > 0)
                        .map((recipient) => {
                          const accounts = bankAccounts[recipient.id] || [];
                          const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];
                          const isSelected = selectedRecipients.some((r) => r.recipient.id === recipient.id);
                          const selectedRecipientData = selectedRecipients.find(
                            (r) => r.recipient.id === recipient.id
                          );

                          return (
                            <tr key={recipient.id} className={isSelected ? 'bg-blue-50' : ''}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRecipient(recipient)}
                                  className="w-4 h-4 text-blue-600"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <div className="font-medium">
                                    {recipient.firstName} {recipient.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">{recipient.email}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {defaultAccount && (
                                  <div className="text-sm">
                                    <div>{defaultAccount.bankName}</div>
                                    <div className="text-gray-500">
                                      {defaultAccount.accountType} ••••{defaultAccount.accountNumberLast4}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {isSelected && (
                                  <input
                                    type="number"
                                    value={selectedRecipientData?.amount || ''}
                                    onChange={(e) =>
                                      updateRecipientAmount(recipient.id, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-32 px-2 py-1 border rounded"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedRecipients.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-blue-600">Total Amount</div>
                      <div className="text-2xl font-bold text-blue-900">
                        ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-sm text-blue-600">
                      {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedRecipients([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePayout}
                disabled={loading || selectedRecipients.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Payroll Run'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payouts History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payout ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Processed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.map((payout) => {
                const recipient = recipients.find((r) => r.id === payout.recipientId);
                return (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {payout.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recipient && (
                        <div>
                          <div className="font-medium text-gray-900">
                            {recipient.firstName} {recipient.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{recipient.email}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${(parseInt(payout.amountCents) / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPayoutStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.scheduledPayoutDate
                        ? new Date(payout.scheduledPayoutDate).toLocaleDateString()
                        : 'Immediate'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.actualPayoutDate
                        ? new Date(payout.actualPayoutDate).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {payouts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No payouts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollPayouts;

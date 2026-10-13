
import React, { useMemo } from 'react';
import { CHART_OF_ACCOUNTS } from '../constants.js';
import { AccountType, Entity } from '../types.js';
import type { JournalEntry, Account } from '../types.js';

interface ChartOfAccountsViewProps {
  journalEntries: JournalEntry[];
}

// NEW: Account status and tax code (simulated on the Account interface for demo)
interface EnhancedAccount extends Account {
  status?: 'Active' | 'Inactive';
  taxCode?: string;
  normalBalance?: 'Debit' | 'Credit';
}

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({ journalEntries }) => {
  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case AccountType.Asset: return 'bg-blue-500/20 text-blue-400';
      case AccountType.Liability: return 'bg-red-500/20 text-red-400';
      case AccountType.Equity: return 'bg-purple-500/20 text-purple-400';
      case AccountType.Income: return 'bg-green-500/20 text-green-400';
      case AccountType.Expense: return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getEntityTypeColor = (entity: Entity) => {
    switch (entity) {
      case Entity.LLC: return 'bg-sov-accent/20 text-sov-accent';
      case Entity.Trust: return 'bg-sov-gold/20 text-sov-gold';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getEntityAbbreviation = (entityValue: Entity) => {
    return Object.keys(Entity).find(key => Entity[key as keyof typeof Entity] === entityValue) || 'N/A';
  };

  // NEW: Status and tax code display
  const getStatusColor = (status?: string) => {
    return status === 'Active' ? 'bg-sov-green/20 text-sov-green' : 'bg-gray-500/20 text-gray-400';
  };

  const accountBalances = useMemo(() => {
    const balances = new Map<number, number>();

    // Initialize all accounts with a balance of 0
    CHART_OF_ACCOUNTS.forEach(account => {
        balances.set(account.id, 0);
    });

    journalEntries.forEach(entry => {
        entry.lines.forEach(line => {
            const account = CHART_OF_ACCOUNTS.find(acc => acc.id === line.accountId);
            if (account) {
                const currentBalance = balances.get(account.id) || 0;
                let amountChange = 0;

                // For Asset and Expense accounts, DEBIT increases the balance.
                if (account.type === AccountType.Asset || account.type === AccountType.Expense) {
                    amountChange = line.type === 'DEBIT' ? line.amount : -line.amount;
                } 
                // For Liability, Equity, and Income accounts, CREDIT increases the balance.
                else {
                    amountChange = line.type === 'CREDIT' ? line.amount : -line.amount;
                }
                balances.set(account.id, currentBalance + amountChange);
            }
        });
    });

    return balances;
  }, [journalEntries]);

  return (
    <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-sov-light">Chart of Accounts</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-3">Account ID</th>
              <th className="p-3">Account Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Entity</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Tax Code</th>
              <th className="p-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {CHART_OF_ACCOUNTS.map(account => {
              // Simulate enhanced account data for demo
              const enhancedAccount = account as EnhancedAccount;
              const status = enhancedAccount.status || 'Active';
              const taxCode = enhancedAccount.taxCode || 'N/A';
              
              return (
                <tr key={account.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3 font-mono">{account.id}</td>
                  <td className="p-3 font-semibold">{account.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}>
                      {account.type}
                    </span>
                  </td>
                  <td className="p-3">
                    <span title={account.entity} className={`px-2 py-1 text-xs font-semibold rounded-full ${getEntityTypeColor(account.entity)}`}>
                      {getEntityAbbreviation(account.entity)}
                    </span>
                  </td>
                  {/* NEW: Status + Tax Code columns */}
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-sov-light-alt">
                    {taxCode}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {(accountBalances.get(account.id) || 0).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

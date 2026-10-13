/**
 * Agentic Financial Oracle Copilot Service
 * 
 * Provides agentic action-planning, intent parsing, balance simulation,
 * and conversational execution for the Chief Ledgering Consul.
 */

import type { JournalEntry, Invoice, Account } from '../types.js';
import { CHART_OF_ACCOUNTS } from '../constants.js';

export interface CopilotActionPlan {
  id: string;
  userPrompt: string;
  intent: 'SETTLE_INTERCOMPANY' | 'PAY_OVERDUE_AP' | 'PROVE_SOLVENCY' | 'SIMULATE_FEDNOW' | 'AUDIT_ANOMALY';
  explanation: string;
  stagedJournalLines: Array<{
    accountId: number;
    accountName: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
  }>;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  affectedAccounts: string[];
  executionStatus: 'PROPOSED' | 'CONFIRMED' | 'EXECUTED';
}

class OracleCopilotService {
  /**
   * Parse natural language command and synthesize an executable double-entry action plan
   */
  public generateActionPlan(
    prompt: string,
    context: {
      intercompanyBalance: number;
      apInvoices: Invoice[];
      journalEntries: JournalEntry[];
    }
  ): CopilotActionPlan {
    const lower = prompt.toLowerCase();

    // 1. Intercompany Netting Intent
    if (lower.includes('intercompany') || lower.includes('zero balance') || lower.includes('net') || lower.includes('balance sheet')) {
      const balance = context.intercompanyBalance;
      const amount = Math.abs(balance) || 12500; // Default simulated amount if already 0

      return {
        id: `PLAN-${Date.now()}`,
        userPrompt: prompt,
        intent: 'SETTLE_INTERCOMPANY',
        explanation: `Net intercompany payable (2200) against cash reserves (1000) to bring intercompany variance to exactly $0.00 across GM Family Trust and SOVR Development Holdings LLC.`,
        stagedJournalLines: [
          { accountId: 2200, accountName: 'Intercompany-Payable-LLC', type: 'DEBIT', amount },
          { accountId: 1000, accountName: 'Cash-ODFI-LLC', type: 'CREDIT', amount }
        ],
        totalDebit: amount,
        totalCredit: amount,
        isBalanced: true,
        affectedAccounts: ['Intercompany-Payable-LLC', 'Cash-ODFI-LLC'],
        executionStatus: 'PROPOSED'
      };
    }

    // 2. Pay AP Invoices Intent
    if (lower.includes('pay') || lower.includes('ap') || lower.includes('vendor') || lower.includes('bill')) {
      const pendingAp = context.apInvoices.filter(i => i.status !== 'Paid');
      const invoiceToPay = pendingAp[0] || { id: 'AP-EXP-01', counterparty: 'AWS Cloud Services', amount: 4850 };
      const amount = invoiceToPay.amount;

      return {
        id: `PLAN-${Date.now()}`,
        userPrompt: prompt,
        intent: 'PAY_OVERDUE_AP',
        explanation: `Settle payable for ${invoiceToPay.counterparty} ($${amount.toLocaleString()}) via Vault USDC reserves (1010) and decrement liability 2300-AP.`,
        stagedJournalLines: [
          { accountId: 2300, accountName: 'AP', type: 'DEBIT', amount },
          { accountId: 1010, accountName: 'Cash-Vault-USDC', type: 'CREDIT', amount }
        ],
        totalDebit: amount,
        totalCredit: amount,
        isBalanced: true,
        affectedAccounts: ['AP', 'Cash-Vault-USDC'],
        executionStatus: 'PROPOSED'
      };
    }

    // 3. FedNow instant simulation
    if (lower.includes('fednow') || lower.includes('instant') || lower.includes('iso')) {
      const amount = 25000;
      return {
        id: `PLAN-${Date.now()}`,
        userPrompt: prompt,
        intent: 'SIMULATE_FEDNOW',
        explanation: `Simulate incoming FedNow ISO 20022 pacs.008 message. Credit ODFI cash (1000) and acknowledge customer AR (1300) with sub-second finality.`,
        stagedJournalLines: [
          { accountId: 1000, accountName: 'Cash-ODFI-LLC', type: 'DEBIT', amount },
          { accountId: 1300, accountName: 'AR', type: 'CREDIT', amount }
        ],
        totalDebit: amount,
        totalCredit: amount,
        isBalanced: true,
        affectedAccounts: ['Cash-ODFI-LLC', 'AR'],
        executionStatus: 'PROPOSED'
      };
    }

    // Default Fallback: Solvency & Anomaly Audit
    return {
      id: `PLAN-${Date.now()}`,
      userPrompt: prompt,
      intent: 'PROVE_SOLVENCY',
      explanation: `Run cryptographic verification pass across all ${context.journalEntries.length} general ledger entries, compute SHA-256 Merkle root, and verify debit-credit equality.`,
      stagedJournalLines: [],
      totalDebit: 0,
      totalCredit: 0,
      isBalanced: true,
      affectedAccounts: ['Chart of Accounts Audit Suite'],
      executionStatus: 'PROPOSED'
    };
  }
}

export const oracleCopilot = new OracleCopilotService();

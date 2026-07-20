# Views

This directory contains the main page-level React components (views) for the Oracle Ledger application.

## Available Views

| View | Description |
|------|-------------|
| `DashboardView.tsx` | System overview and KPIs |
| `JournalView.tsx` | General ledger with approval workflow |
| `PayrollView.tsx` | Employee management and payroll processing |
| `VendorManagementView.tsx` | Vendor registry with compliance fields |
| `CardManagementView.tsx` | Company cards with expense tracking |
| `ConsulCreditsView.tsx` | Blockchain token operations |
| `ISO20022View.tsx` | NACHA / ISO 20022 messaging |
| `AccountsPayableView.tsx` | Vendor invoices and payments |
| `AccountsReceivableView.tsx` | Customer invoicing |
| `PurchaseOrdersView.tsx` | Purchase order management |
| `ChartOfAccountsView.tsx` | Chart of accounts with balances |
| `Stripe*View.tsx` | Various Stripe-related views |
| `SettingsView.tsx` | Application settings |

## Notes

- Each view is responsible for its own data fetching and state management.
- Complex logic is often delegated to services in the `services/` directory.
- Modals and shared UI elements are imported from `components/`.
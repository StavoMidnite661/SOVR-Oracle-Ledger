# Components

This directory contains reusable React components used throughout the Oracle Ledger frontend.

## Organization

Components are organized by feature area:

- `compliance/` — Audit trails, policy management, risk tools
- `customers/` — Customer and payment method management
- `dashboard/` — Overview widgets and analytics
- `layout/` — Sidebar, header, and navigation
- `payments/` — ACH, card, and direct deposit forms
- `payroll/` — Employee and payout components
- `shared/` — Common UI elements (Modal, buttons, etc.)

## Usage

Components follow a consistent pattern and are imported directly from their folders.

Example:
```tsx
import { Modal } from '../components/shared/Modal';
import { AuditTrailExplorer } from '../components/compliance/AuditTrailExplorer';
```
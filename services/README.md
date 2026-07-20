# Services

This directory contains business logic and integration services used by the Oracle Ledger frontend and backend.

## Key Services

| Service | Purpose |
|---------|---------|
| `apiService.ts` | Centralized API calls to the backend |
| `consulCreditsService.ts` | Blockchain interaction for Consul Credits |
| `iso20022Service.ts` | ISO 20022 / NACHA message generation and parsing |
| `auditLogger.ts` | PCI and compliance audit logging |
| `blockchainService.ts` | General blockchain utilities |

## Usage

Services are typically imported as singletons:

```tsx
import { consulCreditsService } from '../services/consulCreditsService';
import { iso20022Service } from '../services/iso20022Service';
```

Most services handle their own state and configuration.
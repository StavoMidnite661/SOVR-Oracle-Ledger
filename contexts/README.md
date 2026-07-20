# Contexts

This directory contains React Context providers for global state management.

## Current Contents

- `WalletContext.tsx` — Wallet connection, ENS, and balance management

## Usage

Wrap your application or specific components with the context provider:

```tsx
import { WalletProvider } from './contexts/WalletContext';

<WalletProvider>
  <App />
</WalletProvider>
```

Contexts help avoid prop drilling for frequently used global state such as wallet connection status.
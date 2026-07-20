# 🔗 Web3 & Wallet Connectivity Audit
## SOVR-Oracle-Ledger — Focused Technical Review

**Date:** 2026-07-18  
**Scope:** All Web3, wallet, and blockchain account visibility features  
**Primary Files Analyzed:**
- `services/consulCreditsService.ts`
- `services/blockchainService.ts`
- `App.tsx`
- `views/ConsulCreditsView.tsx`
- `components/shared/SystemConsole.tsx`

---

## Executive Summary

The project has **moderate Web3 integration** focused on the **Consul Credits Wrapper** on Base Mainnet. It supports browser wallet connection (MetaMask / Rabby), network switching, real-time balance visibility, and on-chain transaction flows (deposit/withdraw).

**Overall Web3 Maturity: 5.8 / 10**

**Strengths:**
- Functional `connectWallet()` using `ethers.BrowserProvider`
- Network switching + auto-add for Base Mainnet
- Real-time account change detection (`accountsChanged`, `chainChanged`)
- Token balance visibility tied to connected wallet
- Deposit/Withdraw flows with proper approval + signature steps

**Critical Weaknesses:**
- No persistent session or wallet state management
- Fragile RPC fallback logic
- Limited error UX and no wallet detection UI
- No multi-wallet support or advanced features (ENS, hardware wallets)
- Security surface is entirely dependent on `window.ethereum`

---

## 1. Wallet Connection Implementation

### Location
- `consulCreditsService.connectWallet()` (lines 780–795)
- Called from `App.tsx:handleConnectWallet()`

### Code Quality

```typescript
async connectWallet(): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No crypto wallet found. Please install RABBY, MetaMask or Phantom.');
  }

  const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
  this.signer = await browserProvider.getSigner();
  this.walletAddress = await this.signer.getAddress();
  return this.walletAddress;
}
```

**Assessment:** Basic but functional. Correctly uses modern `BrowserProvider`.

**Issues:**
- No support for `eth_requestAccounts` with proper error codes
- No distinction between "no wallet installed" vs "user rejected connection"
- No loading state exposed to UI during connection

---

## 2. Network Management

### Features Implemented
- `switchNetwork(chainId)` — handles `wallet_switchEthereumChain`
- Auto-add logic for Base Mainnet (8453) and Sepolia (11155111)
- Chain change listener in `App.tsx`

### Strengths
- Proper hex conversion
- Fallback to `wallet_addEthereumChain` when network is missing
- UI shows "Wrong Network" state when not on Base

### Weaknesses
- No automatic network detection on initial load beyond `eth_chainId`
- No support for other networks (Arbitrum, Optimism, etc.)
- Hardcoded chain parameters

---

## 3. Account Visibility & State Management

### Implementation
- `walletAddress` state in `App.tsx`
- Listeners:
  - `accountsChanged` → updates address or clears on disconnect
  - `chainChanged` → updates config and forces re-init

### Current Behavior
- Auto-connects if user previously authorized the site (`eth_accounts`)
- Clears balances when wallet disconnects
- Refreshes token balances when `walletAddress` changes

**Gaps:**
- No localStorage persistence of last connected address
- No "Previously connected" indicator
- No support for multiple accounts selection

---

## 4. Balance & Token Visibility

### Implementation
- `getUserTokenBalances(userAddress, tokenAddresses)`
- Uses `signer.provider` when wallet is connected, falls back to read-only provider
- Displayed in `ConsulCreditsView` and token cards

### Strengths
- Dynamic balance fetching after connection
- MAX button in deposit modal uses live wallet balance

### Weaknesses
- No polling / real-time balance updates after transactions
- No native token (ETH) balance display
- Balance formatting assumes 18 decimals in several places

---

## 5. Transaction Flows (Deposit / Withdraw)

### Flow Quality
The deposit flow is well-structured:

1. User selects token → opens modal
2. Amount input with MAX from wallet balance
3. Review step
4. **Approve** transaction (if needed)
5. **Deposit** transaction
6. Success screen with Basescan link

**Positive Patterns:**
- Stepper UI (`INPUT → REVIEW → SIGNING → SUCCESS`)
- Allowance check before approving
- Proper use of signer for write operations

**Issues Found:**
- Withdraw button exists in UI but **no `onWithdraw` handler** is wired in `ConsulCreditsView`
- Deposit flow calls `onDeposit` but Withdraw modal has no corresponding function
- No gas estimation or simulation before signing

---

## 6. Event Listening & Real-time Updates

### Implementation
- `startEventListening()` in `consulCreditsService`
- Listens to `TokenDeposited` and `TokenWithdrawn` events
- Deduplication using `transactionHash + logIndex`

**Assessment:** Good foundation, but:
- Only runs when `ConsulCreditsView` is active
- No reconnection logic if provider drops
- No historical event backfill beyond the last 2000 blocks

---

## 7. Security & Best Practices

| Area                        | Status     | Notes |
|----------------------------|------------|-------|
| Wallet connection          | Partial    | Basic implementation |
| Network validation         | Good       | Switch + add logic present |
| Signature requests         | Good       | Uses signer correctly |
| Private key exposure       | N/A        | Never exposes keys (good) |
| RPC security               | Weak       | Multiple public RPCs with no auth |
| Input sanitization         | Weak       | Amount inputs have minimal validation |
| Error messages             | Medium     | Some user-friendly messages, many raw errors |
| Hardware wallet support    | None       | Not implemented |

**Risks:**
- Heavy reliance on `window.ethereum` without verification
- No protection against malicious injected providers
- No transaction simulation before user signs

---

## 8. Missing Features (High Value)

1. **Wallet Detection UI** — Show available wallets (MetaMask, Rabby, Coinbase Wallet, etc.)
2. **ENS Resolution** — Display human-readable names
3. **Balance Refresh Button** — Manual refresh for balances
4. **Transaction History from Wallet** — Show pending/confirmed txs
5. **Disconnect Confirmation** — Prevent accidental disconnects
6. **Multi-chain Support** — Beyond Base
7. **Gas Fee Estimation** — Show estimated cost before signing
8. **Account Switching UI** — Let user choose which account to use

---

## 9. Recommendations (Prioritized)

### High Priority
1. **Add proper wallet detection** with visual selector
2. **Implement Withdraw handler** (currently broken in UI)
3. **Add gas estimation** before deposit/withdraw
4. **Persist last connected wallet address** in localStorage
5. **Improve error handling** for `eth_requestAccounts` rejection codes

### Medium Priority
6. Add ENS name resolution for connected address
7. Implement balance polling (every 15–30s when tab is visible)
8. Add native ETH balance display
9. Create a dedicated `WalletContext` or Zustand store instead of scattered state

### Low Priority
10. Support for Ledger / Trezor hardware wallets
11. Add transaction simulation (via Tenderly or `eth_call`)
12. Multi-wallet connection (allow connecting multiple accounts)

---

## 10. Final Assessment

| Category                    | Score | Comments |
|----------------------------|-------|----------|
| Connection UX              | 6/10  | Functional but basic |
| Network Handling           | 7/10  | Good Base support |
| Balance Visibility         | 6/10  | Works but limited |
| Transaction Flows          | 7/10  | Strong deposit, missing withdraw |
| Real-time Updates          | 5/10  | Event listeners exist but fragile |
| Security                   | 4/10  | Minimal safeguards |
| Feature Completeness       | 4/10  | Many missing enterprise features |
| **Overall Web3 Score**     | **5.8/10** | — |

---

**Conclusion:**

The Web3 integration is **usable for a prototype** and demonstrates correct use of `ethers.js` for browser wallets. However, it lacks the polish, robustness, and advanced features expected in a production financial system.

The most immediate issues are:
- Broken/missing Withdraw functionality
- Lack of wallet selection UI
- No gas estimation or transaction simulation

With focused improvements in the areas above, the Web3 experience could be elevated to a solid 8/10.

---

*Report generated as part of E3E audit framework*  
*Focused Web3 & Wallet Connectivity Review*
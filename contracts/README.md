# Smart Contracts

This directory contains the Solidity smart contracts used by Oracle Ledger.

## Contracts

- `ConsulCreditsWrapper.sol` — ERC-20 compatible token for Consul Credits on Base Mainnet

## Features

- Minting and burning controlled by authorized roles
- Pausable for emergency situations
- Ownable for administrative control

## Deployment

Contracts are compiled and deployed using Hardhat.

```bash
npm run compile-contracts
npx hardhat run scripts/deploy.js --network base
```

## Note

The contract address is configured via the `CONSUL_CREDITS_CONTRACT` environment variable.
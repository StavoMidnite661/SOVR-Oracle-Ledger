# SOVR Technical Documentation

**Complete Technical Reference for the SOVR Ecosystem**

---

## Quick Navigation

This documentation suite provides comprehensive technical specifications for the SOVR distributed ledger ecosystem.

### Core Specifications

| Document | Version | Description | Last Updated |
|----------|---------|-------------|--------------|
| [**TECHNICAL_SPECIFICATION.md**](TECHNICAL_SPECIFICATION.md) | 1.0 | Master document covering all missing technical components | 2026-04-01 |
| [**CONSENSUS_IMPLEMENTATION.md**](CONSENSUS_IMPLEMENTATION.md) | 1.0 | SMLC consensus, TigerBeetle configuration, Attestor integration | 2026-04-01 |
| [**GOVERNANCE_SPECIFICATION.md**](GOVERNANCE_SPECIFICATION.md) | 1.0 | Delegated Attestor DAO, quorum management, slashing | 2026-04-01 |
| [**PERFORMANCE_BENCHMARKS.md**](PERFORMANCE_BENCHMARKS.md) | 1.0 | Throughput targets, latency benchmarks, scalability profiles | 2026-04-01 |
| [**INTEROPERABILITY_STANDARDS.md**](INTEROPERABILITY_STANDARDS.md) | 1.0 | IBC-Light adapter, bridges, oracle standards | 2026-04-01 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SOVR ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 3: Economic Finality                          │  │
│  │  - SOVR staking & slashing                          │  │
│  │  - Attestor reputation system                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 2: Consensus (TigerBeetle BFT)                │  │
│  │  - 5-node cluster, 3f+1 tolerance                   │  │
│  │  - 1,200,000 TPS, <5ms p99 latency                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Layer 1: Attestor Quorums                            │  │
│  │  - 100 elected Attestors                             │  │
│  │  - Specialized quorums (high-value, cross-border)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Application Layer                                   │  │
│  │  - Credit Terminal (claim submission)               │  │
│  │  - Oracle Ledger (financial management)            │  │
│  │  - Observer Services (Postgres, Analytics)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌──────────────────────────────────────────────────────┘  │
│  │  Interoperability Layer                                │
│  │  - IBC-Light (cross-chain)                           │
│  │  - Fiat on/off-ramps (Stripe, ACH)                  │
│  │  - Asset bridges (ERC-20 wrappers)                   │
│  └───────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

---

## Key Technical Details

### 1. Consensus: SMLC (SOVR Multi-Layer Consensus)

**Components:**
- **TigerBeetle BFT:** 5-node cluster, deterministic ordering, 1.2M TPS
- **Attestor Quorums:** 100 elected validators, 2/3 or 3/5 thresholds
- **Economic Finality:** 100K SOVR stake, slashing for misbehavior

** specification:** [CONSENSUS_IMPLEMENTATION.md](CONSENSUS_IMPLEMENTATION.md)

---

### 2. Data Structures: Hybrid Merkle Forests

**TigerBeetle Binary Format:**
- 256-byte fixed-size transfer records
- Append-only log with copy-on-write snapshots
- SHA-256 integrity, AES-256-GCM optional encryption

**Merkle Forest:**
- Each batch = leaf node
- Era roots every 1000 batches
- Patricia tries for account states

---

### 3. Governance: Delegated Attestor DAO

**Structure:**
- Layer 0: Token holders (vote for Attestors)
- Layer 1: 100 Attestors (elected by token weight)
- Layer 2: Quorums (specialized for transfer types)

**Key Mechanisms:**
- 1-year terms, quarterly reviews
- 100K SOVR minimum stake
- Slashing for misbehavior (10-50%)
- Policy lifecycle with committee review

**Specification:** [GOVERNANCE_SPECIFICATION.md](GOVERNANCE_SPECIFICATION.md)

---

### 4. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Clearing throughput | 1,200,000 TPS | 5-node cluster |
| P99 latency | <75ms | Claim → cleared |
| Attestation p99 | <50ms | 3-of-5 quorum |
| Smart contract TPS | 100 TPS | Base Mainnet limited |
| Cluster availability | 99.99% | 52min downtime/year |

**Benchmark results and methodology:** [PERFORMANCE_BENCHMARKS.md](PERFORMANCE_BENCHMARKS.md)

---

### 5. Interoperability Standards

**IBC-Light Protocol:**
- Trust-minimized via economic finality (not trustless)
- 1-2 second confirmation vs. minutes for standard IBC
- Supports token transfer, escrow, multi-hop routing

**Bridges:**
- Lock/Mint model (SOVR → Ethereum)
- Burn/Unlock (Ethereum → SOVR)
- Multisig emergency controls (3-of-5)

**Specification:** [INTEROPERABILITY_STANDARDS.md](INTEROPERABILITY_STANDARDS.md)

---

## Getting Started

### For Architects

Start with [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md) for complete system overview.

### For Operators

See [CONSENSUS_IMPLEMENTATION.md](CONSENSUS_IMPLEMENTATION.md) for TigerBeetle deployment and Attestor setup.

### For Governance Participants

Review [GOVERNANCE_SPECIFICATION.md](GOVERNANCE_SPECIFICATION.md) for election process and quorum operations.

### For Performance Engineers

Run benchmarks following [PERFORMANCE_BENCHMARKS.md](PERFORMANCE_BENCHMARKS.md).

### For Bridge Integrators

Implement IBC-Light using [INTEROPERABILITY_STANDARDS.md](INTEROPERABILITY_STANDARDS.md).

---

## Existing System Components

### Oracle Ledger (Currently Implemented)

The existing `ORACLE-LEDGER-main` directory contains:

| Component | Description | Status |
|-----------|-------------|--------|
| Ledger Core | Legacy monolith (Express.js, Passport) | Production |
| TigerBeetle Service | Financial ledger integration | Production |
| Chain Service | Base Mainnet RPC proxy | Production |
| Payment Service | Stripe/ACH integration | Production |
| Risk Service | Compliance & fraud detection | Production |
| Consul Credits UI | React frontend | Production |
| Smart Contracts | ConsulCreditsWrapper.sol (Base Mainnet) | Deployed |

These components implement the **application layer** on top of the consensus layer described in this documentation.

---

## Outstanding Implementation Items

Based on the gap analysis, the following components need implementation:

- [ ] **Consensus Layer:** Deploy TigerBeetle cluster (currently using single-node instance)
- [ ] **Attestor Infrastructure:** Set up 100 Attestors with HSM
- [ ] **Governance Contracts:** Deploy DAO contracts on Base Mainnet
- [ ] **Slashing Mechanism:** Implement staking & slashing contracts
- [ ] **IBC-Light Relayer:** Build cross-chain bridge daemon
- [ ] **Performance Testing:** Execute benchmark suite (see [PERFORMANCE_BENCHMARKS.md](PERFORMANCE_BENCHMARKS.md))
- [ ] **Compliance:** FinCEN MSB registration, state licenses

---

## Related Documents

- [SOVR Canonical Specification](../.gemini/antigravity/code_tracker/active/The%20Soverign%20Stack_a3303586bc2ad507ce67c8b683f209ebcf7abfdd/91f38e48da68578a17b2743518049c60_SOVR_CANONICAL_SPEC.md)
- [Oracle Ledger README](README.md)
- [Oracle Ledger Architecture](docs/ARCHITECTURE.md)
- [Protocol Buffers](docs/protos/) (if any)

---

## Contributing

These specifications are maintained by the SOVR Architecture Team.

To propose changes:
1. Fork the repository
2. Create a feature branch
3. Update the relevant specification document
4. Submit a pull request with detailed changelog

**Important:** These are living documents. The architecture may evolve based on implementation feedback and regulatory requirements.

---

## License

© 2024 SOVR Development Holdings LLC. All rights reserved.

**Proprietary** - Internal use only. Not for distribution outside SOVR ecosystem.

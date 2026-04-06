# SOVR Governance Specification: Delegated Attestor DAO

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-04-01  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Governance Architecture](#governance-architecture)
3. [Attestor Election Process](#attestor-election-process)
4. [Quorum Formation & Operation](#quorum-formation--operation)
5. [Policy Lifecycle Management](#policy-lifecycle-management)
6. [Slashing & Dispute Resolution](#slashing--dispute-resolution)
7. [DAO Treasury](#dao-treasury)
8. [Emergency Procedures](#emergency-procedures)
9. [Implementation Guide](#implementation-guide)

---

## Executive Summary

SOVR governance is a **two-layer delegated system** where token holders elect Attestors, who then form specialized quorums to govern attestation policies and system parameters.

**Key Principles:**
- **Token-weighted voting** but **one-way delegation** (token holders → Attestors, not re-delegation)
- **Attestor independence:** Once elected, Attestors vote based on policy, not token holder pressure
- **Economic accountability:** 100K SOVR minimum stake, slashing for misbehavior
- **Specialized quorums:** Different quorums for different transfer types (high-value, cross-border, etc.)

---

## Governance Architecture

### Layer 0: Token Holders

All SOVR governance token holders participate in Attestor elections:

```
Token Weights:
- 1 SOVR = 1 vote
- No delegation (direct voting only)
- Snapshot taken at election start (no double-voting)
```

### Layer 1: Attestors (Elected)

100 Attestors elected by total token weight:

```
Requirements:
- Minimum self-stake: 100,000 SOVR
- KYC/AML verified by existing Attestor quorum
- 99.9% uptime SLA
- HSM key management
- Geographic distribution (max 20% from single jurisdiction)
```

**Responsibilities:**
- Vote on policy proposals
- Participate in quorum attestations
- Monitor for systemic risks
- Propose governance changes
- Serve on technical committees

### Layer 2: Quorums (Formed)

Attestors are dynamically assigned to quorums:

| Quorum Type | Size | Threshold | Specialization | Vote Weight |
|-------------|------|-----------|----------------|-------------|
| High-Value | 5 | 3-of-5 | >$100k transfers | 2.0× |
| Cross-Border | 5 | 3-of-5 | International | 1.5× |
| Corporate | 5 | 3-of-5 | Business accounts | 1.0× |
| Retail | 5 | 3-of-5 | Consumer transfers | 0.75× |
| Emergency | 3 | 2-of-3 | Crisis response | 3.0× |
| Governance | All 100 | 51% | Protocol changes | N/A |

**Quorum Assignment Algorithm:**
```typescript
function assignQuorum(claim: Claim): Quorum[] {
  const quorums: Quorum[] = [];
  
  // High-value check
  if (claim.amountUSD >= 100_000) {
    quorums.push(getQuorum('high-value'));
  }
  
  // Cross-border check
  if (isCrossBorder(claim)) {
    quorums.push(getQuorum('cross-border'));
  }
  
  // Corporate account check
  if (claim.sender.isCorporate || claim.receiver.isCorporate) {
    quorums.push(getQuorum('corporate'));
  }
  
  // Default to retail
  if (quorums.length === 0) {
    quorums.push(getQuorum('retail'));
  }
  
  return quorums;
}
```

---

## Attestor Election Process

### Election Timeline (90 Days)

```
Day 0:   Nomination period opens
Day 30:  Nomination period closes
Day 31:  Verification period (KYC/AML, HSM audit)
Day 60:  Campaign period (Attestors present platforms)
Day 80:  Voting opens
Day 90:  Voting closes, results announced
```

### Nomination

**Self-Nomination:**
```bash
# Candidate submits nomination transaction on-chain
sovrcli tx gov nominate-attestor \
  --stake=100000000000  # 100K SOVR in micro-units \
  --platform="https://attestor-candidate-123.com/platform" \
  --kyc-proof="0x..." \
  --from=candidate-wallet \
  --fees=5000uSOVR
```

**Nomination Requirements Checklist:**
- [ ] Minimum 100K SOVR staked (locked for term)
- [ ] KYC/AML verification from previous Attestor quorum
- [ ] HSM key generation proof (public key on-chain)
- [ ] Platform statement (governance philosophy, conflict declarations)
- [ ] Geographic declaration (country, jurisdiction)

### Campaign

Candidates publish **Platform Statements**:
- Position on key policy issues (AML thresholds, privacy, etc.)
- Technical competency (years in fintech, blockchain)
- Conflict of interest disclosures
- Geographic distribution (to ensure global representation)

**Debates:**
- Hosted on SOVR governance forum
- Monthly debates on key topics
- Transcripts published on-chain (IPFS hash)

### Voting

**Voting Mechanism:**
```solidity
contract AttestorElection {
    struct Candidate {
        address candidateAddress;
        uint256 stakeAmount;
        string platformHash;  // IPFS CID
        uint256 voteCount;
        bool isElected;
    }
    
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256) public tokenBalance;  // Snapshot at election start
    
    function vote(address candidate) external {
        require(!hasVoted[msg.sender], "Already voted");
        require(tokenBalance[msg.sender] > 0, "No tokens");
        
        Candidate storage c = candidates[candidate];
        c.voteCount += tokenBalance[msg.sender];
        hasVoted[msg.sender] = true;
    }
}
```

**Voting Period:** 10 days  
**Quorum Required:** 10% of total SOVR supply must vote  
**Election Threshold:** Top 100 candidates by vote weight

### Results & Inauguration

```typescript
interface ElectionResult {
  electionId: string;
  termStart: number;
  termEnd: number;  // termStart + 1 year
  attestors: ElectedAttestor[];
  totalVotesCast: bigint;
  voterTurnoutPct: number;
}

interface ElectedAttestor {
  address: string;
  publicKey: string;
  stakeAmount: bigint;
  geographicRegion: string;
  committeeAssignments: string[];  // e.g., ["aml-committee", "tech-committee"]
  quorumAssignments: QuorumAssignment[];  // Primary + backups
}
```

---

## Quorum Formation & Operation

### Dynamic Quorum Assignment

Quorums are **recomputed monthly** based on:
- Claim types and volumes
- Attestor workload balancing
- Geographic distribution requirements
- Performance metrics (latency, accuracy)

**Algorithm:**
```go
func recomputeQuorums() error {
    // 1. Get claim volume by type from last 30 days
    volumes := getClaimVolumes()
    
    // 2. Determine quorum sizes (min 3, max 7 members)
    sizes := make(map[string]int)
    for claimType, vol := range volumes {
        if vol > 10000 { // >10k claims/month
            sizes[claimType] = 5
        } else if vol > 1000 {
            sizes[claimType] = 3
        } else {
            sizes[claimType] = 3 // but can be shared
        }
    }
    
    // 3. Assign Attestors based on:
    // - Geographic diversity (no >2 from same jurisdiction)
    // - Workload balancing (max 5000 attestations/day/Attestor)
    // - Specialization (KYC experts for corporate, etc.)
    assignments := assignAttestors(sizes)
    
    // 4. Broadcast new quorum config to all Credit Terminals
    return broadcastQuorumConfig(assignments)
}
```

### Quorum Attestation Flow

**Standard 3-of-5 Quorum:**
```
1. Credit Terminal receives claim → routes to quorum
2. Quorum leader (highest reputation member) coordinates
3. Each Attestor:
   a. Validate claim against current policies
   b. If valid, sign: signature = sign(sha256(claim + nonce))
   c. Return signature to leader (or broadcast to all)
4. Leader collects signatures, waits for threshold (3/5)
5. When threshold reached:
   - Aggregate signatures (Ed25519 doesn't aggregate natively → collection)
   - Create quorum attestation: { claimHash, signatures[], quorumId, timestamp }
   - Submit to TigerBeetle (via user_data on transfer)
6. Transfer clears with attestation metadata
```

**Failure Cases:**
- **Timeout (5s):** Quorum failed, claim rejected or routed to emergency quorum
- **Attestor unresponsive:** Leader rotates to next Attestor in member list
- **Threshold not met (4/5 valid, 1 offline):** Use 4/5 if policy allows (fallback mode)
- **Split quorum (2-3):** Deadlock → escalate to Governance quorum for emergency vote

---

## Policy Lifecycle Management

### Policy Proposal Format

```typescript
interface PolicyProposal {
  proposalId: string;  // e.g., "AML-2024-001"
  title: string;
  description: string;
  
  // Conditions (all must be true for claim to be legitimate)
  conditions: Condition[];
  
  // Actions to take if conditions are met
  actions: PolicyAction[];
  
  // Metadata
  quorumId: string;
  category: 'AML' | 'KYC' | 'LIMITS' | 'SANCTIONS' | 'GEOGRAPHY';
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Lifecycle
  proposedBy: string;  // Attestor address
  proposedAt: number;
  status: 'DRAFT' | 'COMMITTEE_REVIEW' | 'QUORUM_VOTE' | 'ACTIVE' | 'EXPIRED' | 'REPEALED';
  
  // Voting
  votes: PolicyVote[];
  startVotingAt?: number;
  endVotingAt?: number;
  threshold: number;  // e.g., 0.51 for 51%
  
  // Implementation
  enforcementStartAt?: number;  // When policy becomes live
  policyHash: string;  // SHA256(policy JSON) for verification
}
```

### Policy Lifecycle Stages

#### 1. Draft

Any Attestor can create a draft:
```bash
# Create draft (stored in governance forum IPFS)
sovrcli policy create --file=aml-threshold-increase.json
# Returns: proposal_id=AML-2024-001, ipfs_cid=Qm...
```

#### 2. Committee Review (Optional for HIGH/CRITICAL)

High-impact policies require committee review:
- **Committee:** 9 Attestors (3 from each: high-value, cross-border, emergency quorums)
- **Review period:** 14 days
- **Decision:** Approve with changes, reject, or advance to vote

#### 3. Quorum Vote

All Attestors can vote (not just quorum members):
```bash
sovrcli policy vote --proposal=AML-2024-001 --vote=YES --reason="Necessary due to FATF update"
```

**Voting Period:** 7 days  
**Threshold:** 
- LOW impact: 51% of Attestors
- MEDIUM: 60%
- HIGH: 67%
- CRITICAL: 75% + emergency quorum approval

#### 4. Implementation

Once approved:
1. Policy added to Attestor daemon config (via distributed config system)
2. `enforcementStartAt` set to 24 hours in future (allow Attestors to update)
3. Policy published to Credit Terminals via WebSocket push
4. Old policy (if any) marked as `EXPIRED`

#### 5. Monitoring & Review

Policies are automatically reviewed every 90 days:
- **Effectiveness metrics:** False positive/negative rates
- **Impact on throughput:** Latency increase
- **Cost:** Operational overhead
- **Compliance:** Alignment with current regulations

**Automatic Expiry:** Policies without review are marked `EXPIRED` after 180 days

---

## Slashing & Dispute Resolution

### Misbehavior Categories

| Violation | Slash % | Additional Penalty | Detection Method |
|-----------|---------|-------------------|------------------|
| **Double-signing** | 50% + removal | Blacklist | Merkle proof of signature on conflicting claim |
| **False positive** (blocking legitimate claim) | 5-20% based on amount | Reputation penalty | Claimant appeal with evidence |
| **False negative** (attesting illegitimate claim) | 25% + removal | Legal action (if fraud) | Regulator or audit detection |
| **Downtime** (<99.9% uptime) | 1% per incident | Quorum removal if >3 incidents/quarter | Uptime monitoring |
| **Key compromise** (late reporting) | 10% | Mandatory key rotation | Security audit |
| **Policy violation** (attesting against policy) | 10-100% based on severity | Removal | Internal audit |

### Slashing Process

1. **Detection:**
   - Automated monitoring (double-sign detection)
   - Claimant appeal (false positive/negative)
   - Periodic audit (random sampling)

2. **Evidence Package:**
```typescript
interface SlashingEvidence {
  misconductType: MisconductType;
  timestamp: number;
  evidence: {
    claimHash?: string;
    conflictingSignatures?: string[];
    policyViolated?: string;
    impactUSD?: bigint;
    proofOfLoss?: boolean;
  };
  reporter: string;  // Address (can be anonymous)
  reporterStake?: bigint;  // If reporter is also an Attestor
}
```

3. **Quorum Review:**
   - Evidence submitted to Emergency quorum (3-of-3)
   - Review period: 24 hours
   - If 2-of-3 confirm, slash executed

4. **Execution:**
```solidity
// Slashing contract on Base Mainnet
function slash(address attestor, SlashingEvidence calldata evidence) external {
    require(msg.sender == emergencyQuorum, "Unauthorized");
    require(evidence.validate(), "Invalid evidence");
    
    Attestor storage a = attestors[attestor];
    uint256 slashAmount = calculateSlashAmount(a.stakeAmount, evidence.misconductType);
    
    // Transfer to DAO treasury
    payable(daoTreasury).transfer(slashAmount);
    a.stakeAmount -= slashAmount;
    
    emit Slashed(attestor, slashAmount, evidence.misconductType);
    
    // Check if below minimum stake or reputation zero
    if (a.stakeAmount < MIN_STAKE || a.reputation == 0) {
        a.isActive = false;
        emit AttestorRemoved(attestor, "Stake too low or reputation zero");
    }
}
```

### Appeal Process

Attestors can appeal slashing decisions:

1. **Notice of Appeal:** Within 7 days of slash
2. **Appeal Bond:** Must post additional 50K SOVR (slashed if appeal denied)
3. **Governance Review:** Full Governance quorum (100 Attestors) votes on appeal
4. **Threshold:** 75% to overturn emergency quorum decision
5. **Outcome:**
   - **Appeal granted:** Slash reversed, bond returned
   - **Appeal denied:** Bond added to DAO treasury, Attestor removed

---

## DAO Treasury

### Revenue Streams

| Source | % of Revenue | Distribution |
|--------|--------------|--------------|
| Attestor slashing | 30% | DAO operations, grants |
| Transaction fees (clearing) | 40% | TigerBeetle node operators |
| Bridge fees | 20% | Bridge operators, insurance fund |
| Attestor election fees | 10% | Election administration |

### Spending Categories

```typescript
interface TreasuryBudget {
  operations: number;           // 30%: Attestors, node operators, salaries
  development: number;         // 25%: Engineering, audits, R&D
  grants: number;              // 15%: Ecosystem development
  insurance: number;           // 10%: Bridge & smart contract insurance
  legalCompliance: number;     // 10%: Licenses, legal, lobbying
  reserves: number;            // 10%: Emergency buffer (3 years ops)
}
```

**Budget Approval:** Attestor quorum vote (51% threshold, quarterly)

---

## Emergency Procedures

### Circuit Breaker

**Trigger Conditions:**
- Systemic fraud detected (>1% of transfers fraudulent)
- Major smart contract vulnerability
- Regulatory freeze order
- Cluster failure >1 hour

**Process:**
```solidity
contract EmergencyControls {
    address public emergencyQuorum;
    uint256 public pauseUntil;
    bool public systemPaused;
    
    function emergencyPause(string calldata reason) external {
        require(msg.sender == emergencyQuorum, "Unauthorized");
        require(!systemPaused, "Already paused");
        
        systemPaused = true;
        pauseUntil = block.timestamp + 24 hours; // Max 24h without extension
        
        emit EmergencyPause(reason, block.timestamp);
    }
    
    function extendPause(uint256 additionalHours) external {
        require(msg.sender == emergencyQuorum, "Unauthorized");
        require(systemPaused, "Not paused");
        
        pauseUntil = block.timestamp + additionalHours * 3600;
        emit PauseExtended(pauseUntil);
    }
    
    function resume() external {
        require(msg.sender == emergencyQuorum, "Unauthorized");
        require(systemPaused, "Not paused");
        
        systemPaused = false;
        emit SystemResumed();
    }
}
```

**What Pauses:**
- New claim submissions (Credit Terminal returns "paused")
- Attestor new attestations (but existing attestations remain valid)
- Bridge operations (except emergency withdrawals)

**What Does NOT Pause:**
- TigerBeetle clearing (existing transfers continue)
- Observers (read-only, always available)
- Withdrawals (funds can always be withdrawn)

---

## Implementation Guide

### Smart Contracts (Base Mainnet)

**Deploy Order:**
1. `AttestorStaking.sol` - Stake management
2. `AttestorElection.sol` - Voting
3. `PolicyRegistry.sol` - Policy storage
4. `EmergencyControls.sol` - Circuit breaker
5. `Treasury.sol` - Fund management

**Deployment Script:**
```bash
#!/bin/bash
# Deploy all governance contracts
forge script script/DeployGovernance.s.sol:DeployGovernance \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Attestor Daemon

**Configuration (`attestor.yaml`):**
```yaml
server:
  listen: "0.0.0.0:8080"
  metrics: "0.0.0.0:9090"
  hsm:
    type: "yubihsm"
    connector: "http://hsm:12345"
    key_id: 1
    password: "${HSM_PASSWORD}"

quorum:
  membership_file: "/etc/sovr/attestor-members.json"
  refresh_interval: 3600  # Reload quorum config every hour

policies:
  directory: "/etc/sovr/policies/"
  refresh_interval: 300   # Reload policies every 5 minutes
  cache_size: 1000

logging:
  level: "info"
  format: "json"

metrics:
  enabled: true
  prometheus_namespace: "sovr_attestor"
```

**Run as Systemd:**
```ini
[Unit]
Description=SOVR Attestor Daemon
After=network.target hsm-connector.service

[Service]
Type=simple
User=attestor
WorkingDirectory=/opt/attestor
ExecStart=/opt/attestor/attestor --config=/etc/sovr/attestor.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Monitoring Setup

**Prometheus Scrape Config:**
```yaml
scrape_configs:
  - job_name: 'attestors'
    static_configs:
      - targets: ['attestor1:9090', 'attestor2:9090']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

**Grafana Alerts:**
```json
{
  "alert": "Attestor Down",
  "expr": "up{job='attestors'} == 0",
  "for": "2m",
  "annotations": {
    "summary": "Attestor {{ $labels.instance }} is down"
  }
}
```

---

## Appendix: Acronyms

| Acronym | Definition |
|---------|------------|
| AML | Anti-Money Laundering |
| BFT | Byzantine Fault Tolerance |
| DAO | Decentralized Autonomous Organization |
| HSM | Hardware Security Module |
| KYC | Know Your Customer |
| SOVR | Sovereign (ecosystem name) |
| SLA | Service Level Agreement |
| TPS | Transactions Per Second |
| UETR | Unique End-to-End Transaction Reference |

---

**Maintained By:** SOVR Governance Committee  
**Next Review:** 2026-07-01

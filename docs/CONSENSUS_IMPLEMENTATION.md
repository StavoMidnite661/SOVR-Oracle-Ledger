# SOVR Consensus Implementation Guide

**Technical Reference for SMLC (SOVR Multi-Layer Consensus)**

---

## Table of Contents

1. [Overview](#overview)
2. [TigerBeetle BFT Configuration](#tigerbeetle-bft-configuration)
3. [Attestor Consensus Integration](#attestor-consensus-integration)
4. [Economic Finality Layer](#economic-finality-layer)
5. [Monitoring & Operations](#monitoring--operations)
6. [Troubleshooting](#troubleshooting)

---

## Overview

SOVR's consensus architecture operates on three layers:

```
Layer 3: Economic Finality
  ↓ Stake-weighted attestation + slashing
Layer 2: TigerBeetle BFT (5 nodes, f=1 tolerance)
  ↓ Deterministic ordering + commit
Layer 1: Network Propagation (Gossipsub)
```

**Throughput Target:** 1,200,000 transfers/sec (5-node cluster)  
**Latency Target:** <5ms p99 clearing latency  
**Fault Tolerance:** Tolerates 1 Byzantine node (20% failure)

---

## TigerBeetle BFT Configuration

### Cluster Setup (Production)

```bash
# Download TigerBeetle
curl -LO https://github.com/tigerbeetle/tigerbeetle/releases/download/v0.28.0/tigerbeetle-0.28.0-linux-x64.tar.gz
tar -xzf tigerbeetle-*.tar.gz
cd tigerbeetle-0.28.0

# Initialize cluster (run on first node)
./tigerbeetle init \
  --cluster-id=1 \
  --replication-factor=3 \
  --main-page-size-bytes=65536 \
  --replica-page-size-bytes=65536

# Start node (on each of 5 servers)
./tigerbeetle start \
  --cluster-id=1 \
  --addresses="0.0.0.0:tcp/6791" \
  --replica-addresses="0.0.0.0:tcp/6792" \
  --main-page-size-bytes=65536 \
  --replica-page-size-bytes=65536 \
  --log-level=info \
  --data-directory=/var/lib/tigerbeetle
```

**Configuration File (`tigerbeetle.conf`):**
```ini
cluster_id = 1
replication_factor = 3

[node]
address = "0.0.0.0:tcp/6791"
replica_address = "0.0.0.0:tcp/6792"

[client]
address = "0.0.0.0:tcp/6790"

[logging]
level = "info"
format = "json"

[metrics]
address = "0.0.0.0:9090"  # Prometheus endpoint
```

**Start as Systemd Service:**
```ini
# /etc/systemd/system/tigerbeetle.service
[Unit]
Description=TigerBeetle
After=network.target

[Service]
Type=simple
User=tigerbeetle
WorkingDirectory=/opt/tigerbeetle
ExecStart=/opt/tigerbeetle/tigerbeetle start --config=/etc/tigerbeetle.conf
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Consensus Parameters

```go
// Consensus tuning (recompile with these flags)
const (
    BatchSizeMax           = 1000    // Max transfers per batch
    BatchSizeMin           = 1       // Minimum batch size
    BatchExpirySeconds     = 1       // Force commit even if batch not full
    LeaderTimeoutMs        = 500     // Leader election timeout
    PrepareTimeoutMs       = 200     // Prepare phase timeout  
    CommitTimeoutMs        = 300     // Commit phase timeout
    ViewChangeDelayMs      = 1000    // View change on leader failure
    
    // Safety
    MaxClientRequestSize   = 16384   // 16KB max request
    MaxBatchSizeBytes      = 1024000 // ~1MB per batch
    
    // Performance
    PreallocateBatchSlots  = true    // Preallocate batch buffer
    ZeroCopyBatch          = true    // Zero-copy batch transfers
)
```

**Expected Performance:**
- **Single node:** 250,000 transfers/sec
- **5-node cluster:** 1,200,000 transfers/sec (4.8× scaling due to communication overhead)
- **P99 latency:** 4-6ms (intra-region, <1ms RTT)

---

## Attestor Consensus Integration

### Attestor Daemon (Go Implementation)

```go
package main

import (
    "context"
    "crypto/ed25519"
    "encoding/hex"
    "log"
    "net/http"
    "time"
    
    "github.com/tigrisdata/tigerbeetle"
)

type AttestorServer struct {
    privateKey ed25519.PrivateKey
    publicKey  ed25519.PublicKey
    stakeAmount int64  // SOVR tokens staked
    reputation  float64 // 0-100 score
    quorumID   string
    hsm        HSMInterface  // Hardware security module
}

func (s *AttestorServer) AttestClaim(w http.ResponseWriter, r *http.Request) {
    var req AttestationRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    // 1. Validate claim against policies
    valid, reasons := s.validateClaim(req.Claim)
    if !valid {
        http.Error(w, "Claim invalid: "+strings.Join(reasons, ", "), 400)
        return
    }
    
    // 2. Create attestation signature
    claimHash := sha256.Sum256(req.Claim)
    signature := ed25519.Sign(s.privateKey, claimHash[:])
    
    // 3. Create attestation record
    att := Attestation{
        ClaimHash:    hex.EncodeToString(claimHash[:]),
        AttestorAddr: s.publicKey,
        Signature:    hex.EncodeToString(signature),
        Timestamp:    time.Now().Unix(),
        QuorumID:     s.quorumID,
    }
    
    // 4. Store in TigerBeetle (as user_data on imaginary transfer)
    // Or return to client for inclusion in real transfer
    json.NewEncoder(w).Encode(att)
}

func (s *AttestorServer) validateClaim(claim Claim) (bool, []string) {
    var reasons []string
    
    // Load applicable policies
    policies := loadPoliciesFor(claim.Type)
    
    for _, policy := range policies {
        if !evaluatePolicy(policy, claim) {
            reasons = append(reasons, policy.Name+" violation")
        }
    }
    
    // Check for double-spending
    if isDoubleSpend(claim) {
        reasons = append(reasons, "double spend detected")
    }
    
    // Check AML watchlists
    if matchesSanctions(claim.Destination) {
        reasons = append(reasons, "sanctions match")
    }
    
    return len(reasons) == 0, reasons
}

func main() {
    // Load HSM-backed key
    privateKey, err := hsm.LoadKey("attestor_main")
    if err != nil {
        log.Fatal(err)
    }
    
    server := &AttestorServer{
        privateKey: privateKey,
        publicKey:  privateKey.Public().(ed25519.PublicKey),
        stakeAmount: 100000, // 100K SOVR
        reputation:  98.5,
        quorumID:    "high-value-quorum",
    }
    
    http.HandleFunc("/attest", server.AttestClaim)
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte(`{"status":"healthy"}`))
    })
    
    log.Println("Attestor daemon listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Quorum Management

```go
type QuorumManager struct {
    quorumID      string
    members       []AttestorInfo
    threshold     int  // e.g., 3 for 3-of-5
    signatures    map[string][]Signature // claimHash → []signatures
    policyCache   *PolicyCache
}

func (qm *QuorumManager) CollectAttestation(claimHash string, signature Signature) error {
    // 1. Verify signature from known member
    att := qm.getAttestor(signature.AttestorAddr)
    if att == nil {
        return fmt.Errorf("unknown attestor")
    }
    
    // 2. Check attestor is still active
    if !att.isActive || att.reputation < 50 {
        return fmt.Errorf("attestor inactive or low reputation")
    }
    
    // 3. Store signature
    qm.signatures[claimHash] = append(qm.signatures[claimHash], signature)
    
    // 4. Check if threshold reached
    if len(qm.signatures[claimHash]) >= qm.threshold {
        return qm.issueQuorumAttestation(claimHash)
    }
    
    return nil
}

func (qm *QuorumManager) issueQuorumAttestation(claimHash string) error {
    // Aggregate signatures using BLS or simple Ed25519 (for now)
    aggregated := aggregateSignatures(qm.signatures[claimHash])
    
    // Write to TigerBeetle (via Credit Terminal)
    _, err := tigerbeetleClient.CreateTransfers([]tigerbeetle.Transfer{
        {
            DebitAccountID:   attestationAccountID,
            CreditAccountID:  quorumEscrowAccountID,
            Amount:           0,  // Zero-value transfer for metadata
            UserData:         encodeAttestation(claimHash, aggregated),
            Ledger:           1,
        },
    })
    
    return err
}
```

---

## Economic Finality Layer

### Staking & Slashing

**Staking Contract (on Base Mainnet):**
```solidity
contract AttestorStaking {
    struct Attestor {
        address addr;
        uint256 stakeAmount;
        uint256 lockedUntil;
        uint256 reputation;
        bool isActive;
        uint256 misbehaviorCount;
    }
    
    mapping(address => Attestor) public attestors;
    Attestor[] public attestorList;
    
    uint256 public constant MIN_STAKE = 100_000 ether; // 100K SOVR
    uint256 public constant SLASH_PERCENT = 10; // 10% of stake
    uint256 public constant UNBOND_PERIOD = 30 days;
    
    event Staked(address indexed attestor, uint256 amount);
    event Slashed(address indexed attestor, uint256 amount, string reason);
    event ReputationUpdated(address indexed attestor, uint256 newScore);
    
    function stake() external payable {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        require(attestors[msg.sender].isActive == false, "Already staked");
        
        attestors[msg.sender] = Attestor({
            addr: msg.sender,
            stakeAmount: msg.value,
            lockedUntil: block.timestamp + UNBOND_PERIOD,
            reputation: 100,
            isActive: true,
            misbehaviorCount: 0
        });
        
        attestorList.push(msg.sender);
        emit Staked(msg.sender, msg.value);
    }
    
    function slash(address attestor, string calldata reason) external {
        require(msg.sender == governanceDAO, "Only DAO");
        Attestor storage a = attestors[attestor];
        require(a.isActive, "Not active");
        
        uint256 slashAmount = (a.stakeAmount * SLASH_PERCENT) / 100;
        payable(governanceDAO).transfer(slashAmount);
        
        a.stakeAmount -= slashAmount;
        a.misbehaviorCount++;
        a.reputation = max(0, a.reputation - 20);
        
        if (a.stakeAmount < MIN_STAKE || a.reputation < 20) {
            a.isActive = false;
        }
        
        emit Slashed(attestor, slashAmount, reason);
    }
    
    function updateReputation(address attestor, uint256 delta) external {
        require(msg.sender == governanceDAO, "Only DAO");
        Attestor storage a = attestors[attestor];
        a.reputation = max(0, min(100, a.reputation + delta));
        emit ReputationUpdated(attestor, a.reputation);
    }
}
```

**Slashing Conditions:**
1. **Double-signing:** Signing two different attestations for same claim → 10% slash
2. **False negative:** Failing to attest a legitimate claim → 5% slash
3. **False positive:** Attesting an illegitimate claim → 25% slash + immediate removal
4. **Downtime:** <99.9% uptime → 1% slash per incident

---

## Monitoring & Operations

### Prometheus Metrics

```go
import "github.com/prometheus/client_golang/prometheus"

var (
    transfersTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "sovr_transfers_total",
            Help: "Total number of transfers processed",
        },
        []string{"node_id", "status"}, // status: success|failed
    )
    
    attestationLatency = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "sovr_attestation_latency_seconds",
            Help:    "Attestation latency distribution",
            Buckets: prometheus.ExponentialBuckets(0.001, 2, 10), // 1ms to 1s
        },
        []string{"quorum_id", "attestor_id"},
    )
    
    attestorStake = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "sovr_attestor_stake",
            Help: "Stake amount per attestor",
        },
        []string{"attestor_address"},
    )
    
    quorumHealth = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "sovr_quorum_health",
            Help: "Quorum health status (1=healthy, 0=unhealthy)",
        },
        []string{"quorum_id"},
    )
)
```

**Expose Metrics Endpoint:**
```go
http.Handle("/metrics", promhttp.Handler())
```

### Grafana Dashboard Panels

**Panel 1: Cluster Throughput**
```promql
sum(rate(tigerbeetle_transfers_total[1m])) by (node)
```

**Panel 2: Attestation Latency (p99)**
```promql
histogram_quantile(0.99, sum(rate(sovr_attestation_latency_seconds_bucket[5m])) by (le))
```

**Panel 3: Quorum Health**
```promql
sovr_quorum_health == 1
```

**Panel 4: Attestor Stake Distribution**
```promql
sovr_attestor_stake
```

---

## Troubleshooting

### Issue: TigerBeetle Cluster Not Forming

**Symptoms:**
- `tigerbeetle status` shows nodes as `Initializing` or `Unavailable`
- Client requests time out

**Checklist:**

1. **Network Connectivity**
   ```bash
   # Verify ports 6790-6792 open between all nodes
   nc -zv node1 6790
   nc -zv node2 6790
   # Should succeed
   ```

2. **Cluster ID Matching**
   ```bash
   ./tigerbeetle info --cluster-id
   # Should output 1 on all nodes
   ```

3. **Replication Factor**
   - Ensure at least 3 nodes are running to form quorum
   - With 5 nodes, can tolerate 2 down

4. **Disk Permissions**
   ```bash
   ls -la /var/lib/tigerbeetle
   # Should be owned by tigerbeetle user
   ```

5. **View Logs**
   ```bash
   journalctl -u tigerbeetle -f
   # Look for "cluster formed" or errors about quorum
   ```

**Common Fixes:**
- **Port conflict:** Change `--addresses` to unused ports
- **Data dir not writable:** `chown -R tigerbeetle:tigerbeetle /var/lib/tigerbeetle`
- **Wrong cluster ID:** Stop all nodes, delete data dir, re-init with correct cluster ID

---

### Issue: High Attestation Latency

**Symptoms:**
- End-to-end transfer latency >100ms (target: <75ms)
- Attestor logs show slow policy evaluation

**Checklist:**

1. **Attestor Health**
   ```bash
   curl http://attestor:8080/health
   # Should return {"status":"healthy"}
   ```

2. **Policy Complexity**
   - Review slow policies (>50ms evaluation time)
   - Simplify nested conditions
   - Cache lookup results (Redis)

3. **Quorum Size**
   - High-value: 5 attestors (3-of-5) → target 80ms
   - Normal: 3 attestors (2-of-3) → target 50ms

4. **Network Latency**
   ```bash
   # Check RTT between Credit Terminal and Attestors
   ping -c 10 attestor1
   ping -c 10 attestor2
   # Should be <10ms in same region
   ```

5. **HSM Performance**
   - YubiHSM 2: ~1ms/signature (total 3ms for 3-of-5)
   - Software keys: ~0.1ms but less secure
   - If >50ms, HSM likely overloaded

---

### Issue: Forks or Double Spends Detected

**Symptoms:**
- TigerBeetle reports "transfer already exists"
- Balance discrepancies between accounts

**Checklist:**

1. **Cluster Synchronization**
   ```bash
   ./tigerbeetle status
   # All nodes should show same view (view number)
   ```

2. **Network Partitions**
   - Check if nodes can communicate (firewall rules)
   - Ensure all nodes have <50ms RTT

3. **Byzantine Node Detection**
   ```bash
   journalctl -u tigerbeetle | grep -i "byzantine"
   # Look for suspicious behavior from specific node
   ```

4. **View Changes**
   - Frequent view changes indicate leader failures
   - Check node resources (CPU, disk IO)
   - Investigate network instability

**Immediate Action:**
- Stop client submissions
- Dump cluster state: `./tigerbeetle dump`
- Contact TigerBeetle support with logs

---

## Appendix: TigerBeetle File Format

**On-Disk Layout:**
```
/var/lib/tigerbeetle/
├── 0000.main          # Main data file (append-only log)
├── 0000.replica       # Replica for node 1
├── 0001.replica       # Replica for node 2
├── ...
└── checkpoints/
    ├── 00000001.checkpoint
    ├── 00000002.checkpoint
    └── ...
```

**Transfer Encoding:**
```rust
// Each transfer is 256 bytes (fixed)
struct Transfer {
    debit_account_id: u32,      // 4 bytes @ offset 0
    credit_account_id: u32,     // 4 bytes @ offset 4
    amount: i128,               // 16 bytes @ offset 8 (little-endian)
    ledger: u32,                // 4 bytes @ offset 24
    timestamp: i64,             // 8 bytes @ offset 28
    user_data: u128,            // 16 bytes @ offset 36
    flags: u32,                 // 4 bytes @ offset 52
    batch_id: u128,             // 16 bytes @ offset 56
    transfer_id: u128,          // 16 bytes @ offset 72
    batch_timezone: i32,        // 4 bytes @ offset 88
    settling_timestamp: i64,    // 8 bytes @ offset 92
    padding: [u8; 48],          // 48 bytes @ offset 100 (zeros)
}
```

**Integrity Verification:**
```bash
# Verify data file integrity
./tigerbeetle verify

# Expected output:
# "Verified 1000000 transfers in 1.23s (813008/s)"
```

---

**Reference:** [TigerBeetle Official Documentation](https://tigerbeetle.com/docs/consensus)

**Last Updated:** 2026-04-01

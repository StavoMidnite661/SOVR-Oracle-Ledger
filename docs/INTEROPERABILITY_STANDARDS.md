# SOVR Interoperability Standards

**Cross-Chain & External System Integration Specifications**

---

## Table of Contents

1. [Overview](#overview)
2. [IBC-Light Protocol (SOVR Adaptation)](#ibc-light-protocol-sovr-adaptation)
3. [Cross-Chain Bridges](#cross-chain-bridges)
4. [Oracle Standards](#oracle-standards)
5. **REST API Integration** (existing Stripe/ACH)
6. [Fiat On-Ramp/Off-Ramp](#fiat-on-rampoff-ramp)
7. [Data Exchange Formats](#data-exchange-formats)
8. [Security Requirements](#security-requirements)

---

## Overview

SOVR achieves interoperability through **economics-backed bridges** rather than cryptographic light clients:

```
Trust Model:
┌─────────────┐      ┌────────────┬────────────┐      ┌─────────────┐
│   SOVR       │─────▶│  Attestor   │  Economic  │─────▶│   Ethereum  │
│  (TigerB.)  │◀─────│  Quorum     │  Finality  │◀─────│   (L1)      │
└─────────────┘      └────────────┴────────────┘      └─────────────┘
    │                                    │
    └────────────── Bridge Contract ──────────────┘
         (Externally Verified)
```

**Key Differentiator:** Relies on SOVR's economic finality (TigerBeetle + Attestors) rather than light client proofs → faster, cheaper, but requires trusted Attestors.

---

## IBC-Light Protocol (SOVR Adaptation)

### Protocol Overview

IBC-Light is a **simplified IBC** (Inter-Blockchain Communication) variant optimized for financial transfers:

- **No light client verification:** Relies on economic finality + Attestor signatures
- **Fast finality:** 1-2 second confirmation vs. minutes for full IBC
- **Reduced overhead:** ~50% smaller packets than standard IBC

### Connection Handshake

```typescript
// Phase 1: Connection Open Init (SOVR → Counterparty)
interface ConnOpenInit {
  client_id: string;        // "07-tigerbeetle-1"
  counterparty: {
    client_id: string;      // "08-eth-0"
    connection_id?: string;
  };
  version: {
    identifier: "ics20-1";  // Token transfer spec
    features: ["order-opt", "batch-opt"]; // Ordered delivery, batching
  };
}

// Phase 2: Connection Open Try (Counterparty → SOVR)
interface ConnOpenTry {
  client_id: string;
  counterparty_client_id: string;
  connection_id: string;    // Temporary ID
  version: {
    identifier: "ics20-1";
    features: ["order-opt", "batch-opt"];
  };
}

// Phase 3: Connection Open Ack (SOVR → Counterparty)
interface ConnOpenAck {
  connection_id: string;    // Final connection ID
  client_id: string;
  counterparty_client_id: string;
  version: "ics20-1";
}

// Phase 4: Connection Open Confirm (Both → Both)
interface ConnOpenConfirm {
  connection_id: string;
}
```

**Implementation Example:**
```typescript
class IBCLightClient {
  async openConnection(counterparty: Counterparty): Promise<string> {
    // Step 1: Init
    const init = await this.connOpenInit(counterparty);
    
    // Step 2: Try (counterparty responds)
    const try_ = await counterparty.connOpenTry(init);
    
    // Step 3: Ack
    await this.connOpenAck(try_);
    
    // Step 4: Confirm
    await counterparty.connOpenConfirm(try_.connection_id);
    
    return try_.connection_id;
  }
}
```

---

### Packet Flow

**Token Transfer (SOVR → Ethereum):**

```
SOVR (Account A)                    Ethereum (Bridge Contract)                Relayer
    │                                      │                                      │
    │ 1. sendTransfer(dest="0x...", amount=100) │
    ├─────────────────────────────────────▶│                                      │
    │                                      │                                      │
    │    (IBC packet created)             │                                      │
    │ packet: { data: {token:"usdSOVR", amount:"100"}, ... } │
    │                                      │                                      │
    │ 2. Cleared in TigerBeetle (batch #1234)│
    │    Transfer includes attestation + proof │
    │                                      │                                      │
    │ 3. Emit event: TransferCleared(batch=1234, ...) │                         │
    ├─────────────────────────────────────▶│                                      │
    │                                      │                                      │
    │                                      │ 4. Relayer watches SOVR events       │
    │                                      │    fetchPacketProof(batch=1234)      │
    │                                      │◀─────────────────────────────────────┤
    │                                      │                                      │
    │                                      │ 5. Relayer submits to Ethereum       │
    │                                      │    bridgeContract.redeem(packet, proof)│
    │                                      │◀─────────────────────────────────────┤
    │                                      │                                      │
    │                                      │ 6. Verify proof (Merkle batch proof)│
    │                                      │    ✓ Batch exists in Merkle forest  │
    │                                      │    ✓ Batch finality: 100 confirmations│
    │                                      │    ✓ Attestor quorum: 3-of-5 valid  │
    │                                      │                                      │
    │                                      │ 7. Mint 100 usdSOVR (ERC-20)        │
    │                                      │    to recipient                     │
    │                                      │◀─────────────────────────────────────┤
    │                                      │                                      │
    │ 8. Receive ERC-20 tokens on Ethereum  │                                      │
    ◀─────────────────────────────────────┼──────────────────────────────────────┘
```

**Packet Data Structure:**
```typescript
interface IBCPacket {
  sequence: number;              // Monotonic per channel
  source_port: string;           // "transfer"
  source_channel: string;        // "channel-1"
  destination_port: string;      // "transfer"
  destination_channel: string;   // "channel-eth-1"
  
  data: TokenTransfer;           // JSON-encoded for flexibility
  
  timeout_timestamp: number;     // Unix timestamp (unix seconds)
  // Packets must be redeemed before timeout or they expire
}

type TokenTransfer = {
  token: {
    denom: "usdSOVR" | "0x...";  // Native SOVR or ERC-20 address
    amount: string;              // Decimal string (to support any precision)
  };
  sender: string;                // SOVR address
  receiver: string;              // Ethereum address (for L2)
  memo?: string;                 // Optional data
};
```

**Proof of Transfer:**
```typescript
interface TransferProof {
  batch_id: string;
  batch_hash: bytes32;           // SHA256 of entire batch
  merkle_proof: {
    leaf_hash: bytes32;          // Hash of specific transfer in batch
    path: bytes32[];             // Sibling hashes to root
  };
  root_hash: bytes32;            // Era root at batch time
  era: number;                   // Era ID (1 era = 1000 batches)
  confirmations: number;         // >=100 required (≈1 hour)
  
  // Attestor signatures (quorum threshold)
  attestations: {
    attestor: string;            // Address or public key
    signature: bytes64;          // Ed25519 signature
  }[];
}
```

**Verification Process (Bridge Contract):**
```solidity
function redeem(
    bytes calldata packet,
    bytes calldata proof
) external returns (bool) {
    // 1. Deserialize
    IBCPacket memory p = abi.decode(packet, (IBCPacket));
    TransferProof memory pr = abi.decode(proof, (TransferProof));
    
    // 2. Verify Merkle proof
    bytes32 computedRoot = computeRoot(
        pr.merkle_proof.path,
        p.dataHash()
    );
    require(computedRoot == pr.root_hash, "Invalid Merkle proof");
    require(pr.confirmations >= 100, "Insufficient confirmations");
    
    // 3. Verify Attestor quorum
    require(verifyAttestorQuorum(pr.attestations, p.dataHash()), "Invalid attestation");
    
    // 4. Check timeout
    require(block.timestamp < p.timeout_timestamp, "Packet expired");
    
    // 5. Mint tokens to receiver
    _mint(p.data.receiver, p.data.token.amount);
    
    emit Redeemed(p.sequence, p.data.receiver, p.data.token.amount);
    return true;
}
```

---

## Cross-Chain Bridges

### Architecture: Lock/Mint (SOVR → Ethereum)

```
1. User locks usdSOVR in SOVR Credit Terminal
2. Attestors validate the lock (3-of-5 quorum)
3. TigerBeetle clears the transfer (debit user, credit bridge escrow)
4. Attestor quorum signs: "Mint X tokens to 0x... on Ethereum"
5. Relayer submits proof to Ethereum Bridge contract
6. Bridge mints wrapped usdSOVR (ERC-20) to recipient
```

**Bridge Contract (Ethereum):**
```solidity
// Wrapper: usdSOVR (ERC-20)
contract USDSoVRWrapper is ERC20 {
    address public sovrBridge;  // Bridge contract address
    
    mapping(bytes32 => bool) public processedPackets;
    
    constructor(address _bridge) ERC20("USD SOVR", "usdSOVR") {
        sovrBridge = _bridge;
    }
    
    // Only bridge can mint
    function mint(address to, uint256 amount, bytes32 packetHash) external {
        require(msg.sender == sovrBridge, "Unauthorized");
        require(!processedPackets[packetHash], "Already minted");
        
        _mint(to, amount);
        processedPackets[packetHash] = true;
        
        emit Minted(to, amount, packetHash);
    }
}

// Bridge: Redeems IBC packets
contract SOVRBridge {
    USDSoVRWrapper public wrapper;
    address public emergencyPauser = 0x...; // 3-of-5 multisig
    
    mapping(bytes32 => bool) public executed;
    
    event Redeemed(bytes32 indexed packetHash, address indexed to, uint256 amount);
    
    function redeem(
        bytes calldata packet,
        bytes calldata proof
    ) external returns (bool) {
        require(!paused, "Paused");
        
        // Deserialize
        IBCPacket memory p = abi.decode(packet, (IBCPacket));
        TransferProof memory pr = abi.decode(proof, (TransferProof));
        bytes32 packetHash = keccak256(abi.encodePacked(packet, proof));
        
        require(!executed[packetHash], "Already executed");
        require(p.source_port == "transfer", "Invalid port");
        require(p.data.token.denom == "usdSOVR", "Invalid token");
        
        // 1. Verify Merkle proof (defers to ZK in production)
        bytes32 root = computeMerkleRoot(pr);
        require(root == pr.root_hash && pr.confirmations >= 100, "Invalid proof");
        
        // 2. Verify Attestor quorum (2-of-3 threshold)
        require(verifyQuorum(pr.attestations, p.dataHash()), "Invalid attestation");
        
        // 3. Mint wrapped tokens
        uint256 amount = uint256(p.data.token.amount);
        wrapper.mint(p.data.receiver, amount, packetHash);
        
        executed[packetHash] = true;
        emit Redeemed(packetHash, p.data.receiver, amount);
        return true;
    }
    
    function emergencyPause() external {
        require(msg.sender == emergencyPauser, "Unauthorized");
        paused = true;
    }
}
```

### Burn/Unlock (Ethereum → SOVR)

Reverse flow:
1. User burns wrapped usdSOVR on Ethereum
2. Bridge emits `Burned` event
3. Relayer watches event, creates IBC packet with burn proof
4. Submits to SOVR Credit Terminal
5. Attestors verify Ethereum transaction
6. TigerBeetle unlocks usdSOVR to user's SOVR address

**Burn Event:**
```solidity
event Burned(
    address indexed from,
    uint256 amount,
    bytes32 packetHash  // Links back to original mint
);
```

**SOVR Unlock Flow:**
```go
func (c *CreditTerminal) handleBurnProof(ctx context.Context, proof BurnProof) error {
    // 1. Verify Ethereum burn transaction
    receipt := ethClient.TransactionReceipt(proof.TxHash)
    if receipt.Status == 0 {
        return errors.New("transaction failed")
    }
    
    // 2. Verify Burned event log
    event := findBurnedEvent(receipt.Logs)
    if event == nil {
        return errors.New("Burned event not found")
    }
    
    // 3. Get quorum attestation of Ethereum receipt
    quorumSig := attestorClient.AttestBurn(ctx, AttestBurnRequest{
        BurnTxHash: proof.TxHash,
        BlockNumber: receipt.BlockNumber,
        PacketHash: proof.PacketHash,
    })
    
    // 4. Create TigerBeetle transfer (unlock)
    _, err := tbClient.CreateTransfers([]tigerbeetle.Transfer{{
        DebitAccountID:  bridgeEscrowAccountID, // Bridge's escrow
        CreditAccountID: getUserAccountID(proof.Sender),
        Amount:          proof.Amount,
        UserData:        quorumSig, // Quorum attestation
        Ledger:          1,
    }})
    return err
}
```

---

## Oracle Standards

### Price Oracle Specification

SOVR requires real-time price feeds for:
- USD per SOVR (internal unit of account)
- Stablecoin prices (USDC, USDT)
- Crypto asset prices (ETH, BTC)

**Oracle Format:**
```typescript
interface PriceFeed {
  // Metadata
  feedId: string;                // "USD-SOVR", "USDC-USD"
  baseAsset: string;             // "SOVR"
  quoteAsset: string;            // "USD"
  decimals: number;              // 8 (price scaling)
  
  // Price data
  price: bigint;                 // Current price (scaled by 1e8)
  confidence: number;            // 0-100 (lower = less certain)
  timestamp: number;             // Unix milliseconds
  
  // Signers
  signers: OracleSignature[];   // At least 2-of-3 required
  roundId: number;
}

interface OracleSignature {
  signer: string;                // Attestor address or known oracle
  signature: bytes;              // Ed25519
  sequence: number;              // Prevent replay
}

// Example price feed message
const usdsovrFeed: PriceFeed = {
  feedId: "USD-SOVR",
  baseAsset: "SOVR",
  quoteAsset: "USD",
  decimals: 8,
  price: 2500000000n,  // $25.00 (2.5 × 1e9)
  confidence: 98,
  timestamp: 1704067200000,
  signers: [
    {
      signer: "0xAttestor1...",
      signature: "0x...",
      sequence: 12345
    },
    {
      signer: "0xAttestor2...",
      signature: "0x...",
      sequence: 12346
    }
  ],
  roundId: 1234
};
```

**Verification:**
```typescript
function verifyPriceFeed(feed: PriceFeed): boolean {
    // 1. Check freshness (timestamp within last 5 minutes)
    if (Date.now() - feed.timestamp > 5 * 60 * 1000) {
        return false;
    }
    
    // 2. Count valid signatures
    let validSigs = 0;
    for (const sig of feed.signers) {
        if (verifySignature(feed.hash(), sig)) { // Ed25519
            validSigs++;
        }
    }
    
    // 3. Require threshold (2-of-3)
    return validSigs >= 2;
}

// Usage in Oracle Contract:
function updatePrice(PriceFeed calldata feed) external {
    require(verifyPriceFeed(feed), "Invalid feed");
    currentPrice = uint256(feed.price);
    lastUpdate = block.timestamp;
}
```

---

## Fiat On-Ramp / Off-Ramp

### Integration with Payment Processors

SOVR integrates with traditional payment rails through **Attestor-validated channels**:

#### On-Ramp (Fiat → SOVR)

```
1. User initiates ACH transfer to SOVR's custodial account
2. Stripe/Lithic processes payment → funds arrive in 1-3 business days
3. Upon confirmation, Attestor quorum validates:
   - AML checks on sender/receiver
   - Transfer limits respected
4. Attestors sign: "Mint 100 usdSOVR to address X"
5. Credit Terminal submits mint to Oracle Integrator
6. Consul Credits contract mints tokens (UserData includes attestation)
7. User receives usdSOVR in wallet (within 1 hour of ACH clearance)
```

**ACH Webhook Processing:**
```typescript
// Stripe webhook handler
app.post('/webhooks/stripe', async (req, res) => {
    const event = req.body;
    
    if (event.type === 'ach_credit_transfer.succeeded') {
        const transfer = event.data.object;
        
        // 1. Verify ACH amount matches expected
        const expected = await getExpectedAmount(transfer.metadata.invoice_id);
        if (transfer.amount !== expected) return res.status(400).end();
        
        // 2. Get Attestor quorum attestation
        const attestation = await attestorClient.attestOnRamp({
            sourceFiat: transfer.amount,
            destinationAddress: transfer.metadata.sovr_address,
            senderBankAccount: transfer.source.id,
            complianceFlags: {
                sanctionsCheck: true,
                amlCheck: true,
                maxAmountExceeded: transfer.amount > 10000
            }
        });
        
        // 3. Mint SOVR tokens via Oracle Integrator
        const mintTx = await oracleContract.oracleMint(
            transfer.metadata.sovr_address,
            toAtomic(transfer.amount),  // Convert to SOVR units
            JSON.stringify({
                type: 'onramp',
                stripeTransferId: transfer.id,
                attestation: attestation
            })
        );
        
        // 4. Record in TigerBeetle
        await tigerbeetle.CreateTransfers([{
            DebitAccountID: onRampEscrowAccount,
            CreditAccountID: userAccount(transfer.metadata.sovr_address),
            Amount: toAtomic(transfer.amount),
            UserData: attestationHash(attestation),
            Ledger: 1,
        }]);
        
        res.json({ success: true, tx: mintTx.hash });
    }
});
```

---

## Data Exchange Formats

### JSON Schema Standard

All external APIs use JSON with strict schemas:

**Transfer Claim:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TransferClaim",
  "type": "object",
  "required": ["sender", "receiver", "amount", "currency"],
  "properties": {
    "sender": {
      "type": "string",
      "description": "SOVR address or external bank account",
      "format": "address-or-iban"
    },
    "receiver": {
      "type": "string"
    },
    "amount": {
      "type": "string",
      "description": "Decimal amount in major units",
      "pattern": "^[0-9]+(\\.[0-9]{1,2})?$"
    },
    "currency": {
      "type": "string",
      "enum": ["USD", "EUR", "GBP", "SOVR"]
    },
    "memo": {
      "type": "string",
      "maxLength": 140
    },
    "timestamp": {
      "type": "number",
      "description": "Unix milliseconds when claim was created"
    },
    "idempotencyKey": {
      "type": "string",
      "description": "Client-provided idempotency key (UUID4)"
    }
  }
}
```

**Attestation Response:**
```json
{
  "claimId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ATTESTED" | "REJECTED" | "PENDING",
  "attestorQuorum": "high-value",
  "signatures": [
    {
      "attestor": "0x1234...",
      "signature": "0xabcd...",
      "timestamp": 1704067200000
    }
  ],
  "rejectionReason": "Sanctions match", // if REJECTED
  "validUntil": 1704153600000  // Unix timestamp (24h default)
}
```

---

## Security Requirements

### Transport Security

- **All internal traffic:** mTLS (mutual TLS) with certificate pinning
- **External APIs:** HTTPS 1.3 with TLS 1.3 only
- **Certificate rotation:** Every 90 days (automated)

### Authentication

**Between Services:**
```yaml
# Using JWT signed by cluster CA
Authorization: Bearer <jwt_token>

# JWT claims:
{
  "sub": "service-name",
  "aud": "sovr-services",
  "iat": 1704067200,
  "exp": 1704153600,
  "scope": ["read:transfers", "write:attestations"]
}
```

**Client to Service:**
- **API Key** for non-sensitive operations
- **OAuth 2.0** for user-facing apps (access tokens via Authorization Code flow)
- **mTLS** for server-to-server (credit terminal ↔ Attestor)

---

## Appendix: Reference Implementations

### IBC-Light Client (TypeScript)

```typescript
class SOVRIBCClient {
    private http: HttpClient;
    private config: IBCConfig;
    
    constructor(rpcUrl: string) {
        this.http = new HttpClient(rpcUrl);
    }
    
    async sendPacket(packet: IBCPacket, proof: TransferProof): Promise<boolean> {
        // 1. Verify proof locally
        assert(proof.confirmations >= 100, "Insufficient confirmations");
        assert(verifyAttestorQuorum(proof.attestations), "Invalid attestation");
        
        // 2. Encode
        const data = abi.encode([packet, proof]);
        
        // 3. Submit
        const resp = await this.http.post('/api/ibc/redeem', { data });
        return resp.success;
    }
    
    async watchForPackets(channel: string): AsyncIterable<IBCPacket> {
        // Long-poll for new packets destined to this channel
        while (true) {
            const packets = await this.http.get(`/api/ibc/channel/${channel}/packets`);
            for (const p of packets) {
                yield p;
            }
            await delay(5000);
        }
    }
}
```

---

**Maintained By:** SOVR Interoperability Working Group  
**Last Updated:** 2026-04-01  
**Next Review:** 2026-04-15

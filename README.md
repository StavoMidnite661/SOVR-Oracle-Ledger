# 🏛️ Oracle Ledger - Enterprise Financial Management System

![Oracle Ledger Console](attached_assets/oracleLedger1.PNG)

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge&logo=statuspage" alt="Status">
  <img src="https://img.shields.io/badge/Type-Microservices-blue?style=for-the-badge&logo=docker" alt="Type">
  <img src="https://img.shields.io/badge/License-Proprietary-orange?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Architecture-Distributed-orange?style=for-the-badge&logo=architecture" alt="Architecture">
</p>

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Technology Stack](#technology-stack)
5. [Microservices Deep Dive](#microservices-deep-dive)
6. [Feature Specifications](#feature-specifications)
7. [Getting Started](#getting-started)
8. [Development Environment](#development-environment)
9. [API Documentation](#api-documentation)
10. [Database Schema](#database-schema)
11. [Blockchain Integration](#blockchain-integration)
12. [Payment Processing](#payment-processing)
13. [Compliance & Security](#compliance--security)
14. [Frontend Components](#frontend-components)
15. [Smart Contracts](#smart-contracts)
16. [Testing & Quality Assurance](#testing--quality-assurance)
17. [Deployment](#deployment)
18. [Troubleshooting](#troubleshooting)
19. [Contributing](#contributing)
20. [License & Support](#license--support)

---

## 🎯 Executive Summary

**Oracle Ledger** is the flagship financial backbone of the SOVR ecosystem, representing a sophisticated, enterprise-grade distributed ledger system designed to handle complex financial operations with unprecedented reliability and security. This comprehensive platform integrates traditional banking rails with cutting-edge blockchain technology, creating a seamless bridge between fiat and cryptocurrency economies.

Originally conceived as a monolithic application, Oracle Ledger has undergone a complete architectural transformation into a containerized microservices ecosystem. This migration delivers enhanced scalability, fault isolation, and maintainability while preserving the robust financial logic that powers the SOVR financial infrastructure.

### Core Value Propositions

| Capability | Description |
|------------|-------------|
| **Dual-Ledger System** | Maintains both traditional accounting ledger and blockchain-backed Consul Credits |
| **Real-Time Compliance** | Continuous PCI DSS audit logging and fraud detection |
| **Multi-Payment Rails** | ACH, Card Payments, Direct Deposit, and Cryptocurrency |
| **Enterprise Security** | SOC 2-ready architecture with comprehensive audit trails |
| **Regulatory Integration** | NACHA, SOX, and GDPR compliance frameworks built-in |

---

## 🏗️ Project Overview

Oracle Ledger serves as the central nervous system for all financial transactions within the SOVR ecosystem. It provides a unified platform for managing:

- **General Ledger Operations**: Double-entry bookkeeping, journal entries, account management
- **Payment Processing**: Stripe integration for ACH, card payments, and direct deposits
- **Blockchain Bridging**: Base Mainnet integration for on-chain token (usdSOVR) operations
- **Risk & Compliance**: Real-time fraud detection, audit logging, and regulatory reporting
- **Payroll Management**: Employee direct deposits, payroll stubs, and bank account management

### System Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SYSTEMS                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ Base        │  │ Stripe      │  │ Traditional │  │ SOVR Frontend   │   │
│  │ Mainnet     │  │ Payments    │  │ Banking     │  │ (User Interface)│   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
└─────────┼────────────────┼────────────────┼──────────────────┼─────────────┘
          │                │                │                  │
          ▼                ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ORACLE LEDGER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API GATEWAY (Port 3002)                      │   │
│  │                  Traffic Routing & Load Balancing                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│          │                │                │                  │              │
│  ┌───────▼───────┐ ┌─────▼──────┐ ┌──────▼─────┐ ┌────────▼────────┐    │
│  │ Ledger Core    │ │Risk Service│ │Chain       │ │Payment Service  │    │
│  │ (Port 3001)   │ │(Port 3003) │ │Service     │ │(Port 3005)      │    │
│  │                │ │            │ │(Port 3004)│ │                 │    │
│  └───────┬────────┘ └─────┬──────┘ └─────┬──────┘ └────────┬────────┘    │
│          │                │               │                  │             │
│          └────────────────┴───────────────┴──────────────────┘             │
│                                    │                                         │
│                          ┌─────────▼─────────┐                             │
│                          │   PostgreSQL      │                             │
│                          │   (Port 5432)     │                             │
│                          │   Database        │                             │
│                          └───────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI Framework |
| **Vite** | 6.x | Build Tool & Dev Server |
| **TypeScript** | 5.8.x | Type Safety |
| **Tailwind CSS** | 4.x | Styling Framework |
| **Recharts** | 3.x | Data Visualization |
| **Lucide React** | 0.563.x | Icon Library |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime Environment |
| **Express** | 5.x | Web Framework |
| **Drizzle ORM** | 0.44.x | Database ORM |
| **PostgreSQL** | 16 | Primary Database |
| **Neon** | Serverless | Cloud Database |

### Blockchain & Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | 0.8.20 | Smart Contract Language |
| **Hardhat** | 2.22.x | Development Framework |
| **Ethers.js** | 6.x | Ethereum Library |
| **Web3.js** | 4.x | Blockchain Interaction |
| **OpenZeppelin** | 5.4.x | Contract Libraries |

### Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Orchestration |
| **Drizzle Kit** | Database Migrations |

---

## 🧩 Microservices Deep Dive

### 1. API Gateway Service (`gateway`)

**Container Name:** `gateway`  
**Host Port:** 3002  
**Internal Port:** 3002

The API Gateway serves as the single entry point for all client requests. It handles:

- **Request Routing**: Directs traffic to appropriate microservices based on URL path prefixes
- **Rate Limiting**: Protects backend services from traffic spikes
- **CORS Management**: Handles cross-origin requests
- **Health Monitoring**: Provides service health check endpoints

#### Routing Configuration

| Path Prefix | Target Service | Internal URL | Description |
|-------------|----------------|---------------|-------------|
| `/api/auth` | Ledger Core | `http://ledger-core:3001` | Authentication & Sessions |
| `/api/employees` | Ledger Core | `http://ledger-core:3001` | Employee Management |
| `/api/vendors` | Ledger Core | `http://ledger-core:3001` | Vendor Management |
| `/api/journal` | Ledger Core | `http://ledger-core:3001` | Journal Entries |
| `/api/risk` | Risk Service | `http://risk-service:3003` | Fraud Detection & PCI Logs |
| `/api/compliance` | Risk Service | `http://risk-service:3003` | Compliance Dashboards |
| `/api/chain` | Chain Service | `http://chain-service:3004` | Blockchain Data |
| `/api/rpc` | Chain Service | `http://chain-service:3004` | Base Mainnet RPC Proxy |
| `/api/payment` | Payment Service | `http://payment-service:3005` | Stripe Wrappers |
| `/api/stripe` | Payment Service | `http://payment-service:3005` | Direct Stripe Webhooks |

### 2. Ledger Core Service (`ledger-core`)

**Container Name:** `ledger-core`  
**Host Port:** 3001  
**Internal Port:** 3001

The Ledger Core is the heart of the financial system, containing the legacy monolith functionality that has been containerized. It manages:

- **User Authentication**: Session management using Passport.js
- **Core Ledger Logic**: Double-entry bookkeeping, account management
- **Employee Management**: Employee records, direct deposit setup
- **Vendor Management**: Vendor accounts, accounts payable/receivable
- **Journal Entries**: Transaction recording and audit trails

#### Core Features

```typescript
// Example: Creating a Journal Entry
interface JournalEntry {
  id: string;
  date: Date;
  description: string;
  entries: JournalEntryLine[];
  status: 'draft' | 'posted' | 'voided';
  createdBy: string;
  createdAt: Date;
}

interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
}
```

### 3. Risk & Compliance Service (`risk-service`)

**Container Name:** `risk-service`  
**Host Port:** 3003  
**Internal Port:** 3003

The Risk Service acts as the watchdog of the financial system, ensuring all operations meet regulatory requirements and security standards.

#### Responsibilities

| Function | Description |
|----------|-------------|
| **PCI Audit Logging** | Comprehensive logging for PCI DSS compliance |
| **Fraud Detection** | Real-time transaction monitoring and anomaly detection |
| **Compliance Checklists** | Regulatory compliance tracking and reporting |
| **Security Monitoring** | Intrusion detection and threat analysis |

#### Compliance Frameworks Supported

- **PCI DSS** (Payment Card Industry Data Security Standard)
- **NACHA** (National Automated Clearing House Association)
- **SOX** (Sarbanes-Oxley Act)
- **GDPR** (General Data Protection Regulation)

### 4. Chain Service (`chain-service`)

**Container Name:** `chain-service`  
**Host Port:** 3004  
**Internal Port:** 3004

The Chain Service bridges the gap between traditional finance and blockchain technology.

#### Key Functions

| Function | Description |
|----------|-------------|
| **Base Mainnet RPC Proxy** | Routes blockchain calls to avoid CORS/rate-limiting issues |
| **Consul Credits Tracking** | Monitors usdSOVR token holdings and transfers |
| **Event Listening** | Subscribes to on-chain events for real-time updates |
| **Transaction Broadcasting** | Signs and submits transactions to Base network |

#### Blockchain Configuration

```javascript
// hardhat.config.cjs network configuration
networks: {
  base: {
    url: process.env.ETHEREUM_RPC_URL || "https://mainnet.base.org",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 8453,
  }
}
```

### 5. Payment Service (`payment-service`)

**Container Name:** `payment-service`  
**Host Port:** 3005  
**Internal Port:** 3005

The Payment Service handles all money movement operations, integrating with Stripe for payment processing.

#### Payment Capabilities

| Payment Type | Description |
|--------------|-------------|
| **ACH Payments** | Direct bank transfers (US) |
| **Card Payments** | Credit and debit card processing |
| **Direct Deposits** | Payroll and mass payments |
| **Reconciliation** | Automatic transaction matching |

#### Stripe Integration Features

- **Payment Intents**: Secure card payment processing
- **Customer Management**: Payment method storage
- **Webhook Handling**: Real-time payment status updates
- **Dispute Management**: Chargeback handling

### 6. Bank Connector Service (`bank-connector`)

**Container Name:** `bank-connector`  
**Host Port:** 3007  
**Internal Port:** 3007

The Bank Connector provides integration with traditional banking rails, enabling:

- **ACH Origination**: Direct deposit and payment processing
- **MICR Parsing**: Bank account validation
- **Bank Account Verification**: Plaid integration for account ownership

---

## 📊 Feature Specifications

### Financial Management Features

#### General Ledger

- **Chart of Accounts**: Hierarchical account structure with unlimited depth
- **Journal Entries**: Manual and automated entry creation
- **Trial Balance**: Real-time balance verification
- **Financial Statements**: Balance sheet, income statement, cash flow

#### Accounts Payable (AP)

- **Vendor Management**: Complete vendor database with payment terms
- **Invoice Processing**: Three-way matching (PO, Receipt, Invoice)
- **Payment Scheduling**: Optimized payment timing for cash flow
- **Early Payment Discounts**: Automated discount calculations

#### Accounts Receivable (AR)

- **Customer Management**: Credit terms and limits
- **Invoice Generation**: Automated billing based on contracts
- **Collections Management**: Aging reports and dunning letters
- **Revenue Recognition**: Multi-period recognition schedules

### Payment Processing Features

#### ACH Payments

```typescript
interface ACHPayment {
  id: string;
  amount: number;
  currency: 'USD';
  bankAccount: BankAccount;
  routingNumber: string;
  transactionType: 'credit' | 'debit';
  addenda?: string;
  status: 'pending' | 'sent' | 'settled' | 'returned';
}
```

#### Card Payments

- Tokenization for PCI compliance
- 3D Secure authentication
- Multi-currency support
- Fraud detection integration

### Compliance Features

#### Audit Trail Explorer

Comprehensive logging of all system actions:

- User login/logout events
- Data modifications with before/after values
- Access to sensitive information
- System configuration changes

#### Regulatory Calendar

- Key compliance deadlines
- Filing reminders
- Regulatory updates
- Audit scheduling

#### Risk Assessment Tool

- Inherent risk scoring
- Control effectiveness evaluation
- Residual risk calculation
- Risk treatment recommendations

---

## 🚀 Getting Started

### Prerequisites

Before running Oracle Ledger, ensure your development environment meets the following requirements:

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Docker Desktop** | Latest | With Docker Compose v2 |
| **Node.js** | 20+ | For local tooling only |
| **PostgreSQL Client** | 16+ | For direct database access |
| **Git** | Latest | For version control |

### Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ORACLE_LEDGER

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Blockchain Configuration
ETHEREUM_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_wallet_private_key
BASESCAN_API_KEY=your_basescan_api_key

# Application Configuration
NODE_ENV=development
PORT=3001

# Security
SESSION_SECRET=your_session_secret_min_32_chars
JWT_SECRET=your_jwt_secret_min_32_chars
```

### Quick Start

#### Option 1: Docker Compose (Recommended)

This is the fastest way to get the entire system running:

```bash
# Navigate to the project directory
cd "ORACLE-LEDGER-main/ORACLE-LEDGER-main"

# Start all services
docker compose up --build -d

# Verify all services are healthy
docker compose ps
```

#### Option 2: Local Development

For active development with hot-reload:

```bash
# Install dependencies
npm install

# Start all services (frontend + backend + microservices)
npm run dev:all

# Or start just frontend and backend
npm run dev:full
```

#### Option 3: Individual Services

Start services individually for focused development:

```bash
# Terminal 1: Frontend (Vite)
npm run dev

# Terminal 2: Backend (Legacy Monolith)
npm run dev:backend

# Terminal 3: API Gateway
tsx microservices/gateway/index.ts

# Terminal 4: Risk & Compliance
tsx microservices/risk-compliance/index.ts

# Terminal 5: Blockchain Bridge
tsx microservices/blockchain-bridge/index.ts

# Terminal 6: Payment Gateway
tsx microservices/payment-gateway/index.ts
```

### Verifying Installation

#### Health Checks

After starting services, verify they're running correctly:

```bash
# Check Gateway
curl http://localhost:3002/health

# Check Ledger Core
curl http://localhost:3001/health

# Check Risk Service
curl http://localhost:3003/health

# Check Chain Service
curl http://localhost:3004/health

# Check Payment Service
curl http://localhost:3005/health
```

#### Access the Dashboard

Open your browser and navigate to:

```
http://localhost:5000
```

> **Note**: The frontend is served via Vite proxy on port 5000, which routes API requests through the Gateway on port 3002.

---

## 🛠️ Development Environment

### Project Structure

```
ORACLE-LEDGER-main/
├── .gitignore                 # Git ignore patterns
├── docker-compose.yml         # Docker orchestration
├── package.json               # NPM dependencies
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
├── hardhat.config.cjs         # Hardhat blockchain config
├── drizzle.config.ts          # Drizzle ORM config
│
├── src/                       # React Frontend
│   ├── components/            # UI Components
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── payments/          # Payment forms & history
│   │   ├── payroll/           # Payroll management
│   │   ├── compliance/        # Compliance tools
│   │   ├── security/          # Security monitoring
│   │   ├── customers/         # Customer management
│   │   ├── shared/            # Reusable components
│   │   └── layout/            # Layout components
│   ├── views/                 # Page-level components
│   ├── services/              # Frontend API services
│   ├── shared/                # Shared types & schemas
│   ├── App.tsx                # Main application
│   ├── index.tsx              # Entry point
│   └── index.css              # Global styles
│
├── server/                    # Legacy Monolith (Ledger Core)
│   └── api.ts                 # Express API server
│
├── microservices/             # Microservices
│   ├── gateway/               # API Gateway
│   ├── risk-compliance/       # Risk & Compliance
│   ├── blockchain-bridge/     # Blockchain integration
│   ├── payment-gateway/      # Stripe integration
│   └── bank-connector/       # Traditional banking
│
├── contracts/                # Solidity Smart Contracts
│   └── ConsulCreditsWrapper.sol
│
├── services/                 # Business logic services
│   ├── achPaymentService.ts
│   ├── cardPaymentService.ts
│   ├── complianceReportingService.ts
│   ├── fraudDetectionService.ts
│   ├── journalTemplateService.ts
│   ├── policyManagementService.ts
│   ├── regulatoryManagementService.ts
│   ├── riskAssessmentService.ts
│   ├── securityComplianceService.ts
│   ├── stripeJournalService.ts
│   └── ...
│
├── shared/                   # Shared code
│   ├── schema.ts             # Database schema (Drizzle)
│   └── schemas.ts            # Zod validation schemas
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # System architecture
│   ├── API_GATEWAY.md        # Gateway documentation
│   ├── OPERATIONS.md         # Operations guide
│   ├── stripe/               # Stripe integration docs
│   ├── api/                  # API specifications
│   └── scripts/               # Test & utility scripts
│
├── scripts/                  # Build & test scripts
└── artifacts/                # Compiled contracts
```

### Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run dev:backend` | Start legacy monolith backend |
| `npm run dev:full` | Start frontend + backend |
| `npm run dev:all` | Start all services (full stack) |
| `npm run build` | Production build |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run compile-contracts` | Compile Solidity contracts |
| `npm run start-node` | Start local Hardhat node |
| `npm test` | Run tests |

### Database Management

#### Schema Updates

The database schema is defined in `shared/schema.ts` using Drizzle ORM. To apply changes:

```bash
# Push schema to database
npm run db:push

# Or open Drizzle Studio for visual editing
npm run db:studio
```

#### Manual Database Access

Connect to the running database:

```bash
# Using Docker
docker exec -it oracle-ledger-main-db-1 psql -U postgres -d ORACLE_LEDGER

# Using local PostgreSQL
psql -U postgres -d ORACLE_LEDGER
```

### Smart Contract Development

#### Compiling Contracts

```bash
npm run compile-contracts
```

#### Deploying to Local Network

```bash
npm run start-node
```

#### Deploying to Base Mainnet

```bash
npx hardhat run scripts/deploy.js --network base
```

---

## 📡 API Documentation

### Authentication

All API requests (except `/api/auth/login` and `/api/auth/register`) require a valid session cookie.

```bash
# Example authenticated request
curl -X GET http://localhost:3002/api/ledger/accounts \
  -H "Content-Type: application/json" \
  -b "connect.sid=your_session_id"
```

### Core Endpoints

#### Ledger Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journal` | List journal entries |
| POST | `/api/journal` | Create journal entry |
| GET | `/api/accounts` | List chart of accounts |
| POST | `/api/accounts` | Create new account |
| GET | `/api/employees` | List employees |
| POST | `/api/employees` | Create employee |

#### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/ach` | Create ACH payment |
| POST | `/api/payment/card` | Create card payment |
| GET | `/api/payment/history` | Payment history |
| POST | `/api/stripe/webhook` | Stripe webhook handler |

#### Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compliance/audit` | Audit trail |
| GET | `/api/compliance/reports` | Compliance reports |
| POST | `/api/risk/assess` | Run risk assessment |

#### Blockchain

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rpc` | RPC call to Base |
| GET | `/api/chain/balance` | Token balance |
| GET | `/api/chain/transactions` | On-chain transactions |

### Response Formats

#### Success Response

```json
{
  "success": true,
  "data": {
    "id": "journal_123",
    "date": "2024-01-15",
    "description": "Payment received",
    "amount": 1000.00
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid account number",
    "details": {
      "field": "accountId",
      "reason": "Account does not exist"
    }
  }
}
```

---

## 💾 Database Schema

### Core Tables

#### Accounts

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
  parent_id UUID REFERENCES accounts(id),
  balance DECIMAL(18, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Journal Entries

```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- draft, posted, voided
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  posted_at TIMESTAMP
);
```

#### Journal Lines

```sql
CREATE TABLE journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id),
  account_id UUID REFERENCES accounts(id),
  debit DECIMAL(18, 2) DEFAULT 0,
  credit DECIMAL(18, 2) DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user', -- admin, manager, user
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

#### Payment Intents

```sql
CREATE TABLE payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- pending, succeeded, failed, refunded
  payment_method VARCHAR(50), -- ach, card
  customer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP
);
```

#### System Logs

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(20) NOT NULL, -- info, warn, error, debug
  service VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_service ON system_logs(service);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
```

---

## ⛓️ Blockchain Integration

### Consul Credits Smart Contract

The system integrates with the **Consul Credits** token on Base Mainnet, enabling tokenized fiat representation.

#### Contract Address

```
0x[DEPLOYED_CONTRACT_ADDRESS]
```

#### Contract Features

- **Minting**: Convert USD to usdSOVR tokens
- **Burning**: Convert usdSOVR tokens back to USD
- **Transfers**: Send tokens between addresses
- **Balances**: Query token holdings
- **Allowances**: Approve third-party transfers

#### Interacting with the Chain

```typescript
// Using Ethers.js
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Check balance
const balance = await contract.balanceOf(userAddress);

// Transfer tokens
const tx = await contract.transfer(toAddress, amount);
await tx.wait();
```

### RPC Rate Limiting

> **Note**: The chain-service connects to the public Base Mainnet RPC endpoint. You may encounter `429 Too Many Requests` errors during high traffic. Use **Mock Mode** in the System Console for UI testing.

---

## 💳 Payment Processing

### Stripe Integration Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ Payment      │────▶│   Stripe    │
│   (React)   │     │ Service      │     │   API       │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Validation │     │  Journal     │     │  Webhooks   │
│  & Tokenize │     │  Recording   │     │  Processing │
└─────────────┘     └──────────────┘     └─────────────┘
```

### ACH Payment Flow

```typescript
// 1. Create Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000, // cents
  currency: 'usd',
  payment_method_types: ['ach_credit_transfer'],
  metadata: { ledger_entry_id: journalEntryId }
});

// 2. Verify Bank Account
const verification = await stripe.verifySource(
  bankAccountId,
  { amounts: [32, 45] } // micro-deposits
);

// 3. Confirm Payment
const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
  payment_method: bankAccountId
});

// 4. Record in Ledger
await recordJournalEntry({
  type: 'ACH_RECEIPT',
  amount: 1000,
  reference: paymentIntent.id
});
```

### Direct Deposit (Payroll)

```typescript
// Process payroll via ACH
const payrollBatch = await stripe.payouts.create({
  amount: totalPayroll,
  currency: 'usd',
  destination: companyBankAccountId,
  metadata: {
    pay_period: '2024-01-01',
    employee_count: employees.length
  }
});
```

---

## 🔒 Compliance & Security

### Security Architecture

#### Authentication Flow

```
┌──────────┐    ┌───────────┐    ┌─────────────┐    ┌──────────┐
│  User    │───▶│  Gateway  │───▶│   Ledger    │───▶│Database  │
│  Login   │    │  (Route)  │    │   Core      │    │(Postgres)│
└──────────┘    └───────────┘    └─────────────┘    └──────────┘
     │                                                
     │                                                
     ▼                                                
┌──────────┐                                          
│ Session  │                                          
│ Cookie   │                                          
└──────────┘                                          
```

#### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, configuration |
| **Manager** | Approve transactions, view all reports |
| **User** | View own data, create own transactions |
| **Auditor** | Read-only access to all data and logs |

### Compliance Features

#### PCI DSS Compliance

- **Card Tokenization**: All card data is tokenized via Stripe
- **Audit Logging**: All payment operations logged
- **Data Encryption**: TLS 1.3 for data in transit
- **Access Controls**: Strict role-based access

#### SOX Compliance

- **Change Tracking**: All modifications logged
- **Segregation of Duties**: Role-based transaction limits
- **Audit Trails**: Immutable log of all actions

---

## 🎨 Frontend Components

### Dashboard Components

| Component | Description |
|-----------|-------------|
| `ComplianceDashboard` | Real-time compliance metrics |
| `FeeAnalytics` | Fee breakdown and trends |
| `PaymentAnalytics` | Payment volume and success rates |
| `ReconciliationDashboard` | Auto-reconciliation status |
| `StripeDashboard` | Stripe transaction overview |
| `WebhookStatus` | Webhook delivery monitoring |

### Payment Components

| Component | Description |
|-----------|-------------|
| `AchPaymentForm` | ACH payment entry |
| `AchPaymentHistory` | ACH transaction history |
| `BankAccountVerification` | Bank account linking |
| `PaymentMethodSetup` | Card/bank method management |
| `ReturnProcessing` | ACH return handling |

### Compliance Components

| Component | Description |
|-----------|-------------|
| `AuditTrailExplorer` | Searchable audit log viewer |
| `ComplianceAlerts` | Real-time compliance notifications |
| `ComplianceHealthMonitor` | Compliance status dashboard |
| `PolicyManagement` | Policy CRUD operations |
| `RiskAssessmentTool` | Risk scoring interface |

---

## 📜 Smart Contracts

### ConsulCreditsWrapper

A Solidity smart contract for tokenized fiat representation on Base Mainnet.

#### Contract Features

- **ERC-20 Compatible**: Standard token interface
- **Minting Control**: Authorized minter role
- **Pause Functionality**: Emergency pause capability
- **Upgradability**: Proxy pattern for upgrades

#### Contract Source

```solidity
// contracts/ConsulCreditsWrapper.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract ConsulCreditsWrapper is ERC20, Ownable, Pausable {
    uint256 public constant decimals = 6; // USDC-style decimals
    
    mapping(address => bool) public minters;
    
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    
    constructor() ERC20("Consul Credits", "CCD") Ownable(msg.sender) {}
    
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
        emit Minted(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }
    
    function addMinter(address account) external onlyOwner {
        minters[account] = true;
    }
}
```

---

## 🧪 Testing & Quality Assurance

### Testing Strategy

The project includes comprehensive test suites covering:

| Test Type | Description | Location |
|-----------|-------------|----------|
| **Unit Tests** | Individual function testing | `services/*.test.ts` |
| **Integration Tests** | API endpoint testing | `docs/scripts/*.ts` |
| **Contract Tests** | Smart contract verification | `test/contracts/` |
| **E2E Tests** | Full flow testing | Manual |

### Running Tests

```bash
# Run unit tests
npm test

# Run specific test suite
tsx docs/scripts/test-ach-endpoints.js
tsx docs/scripts/test-stripe-apis.js

# Run database integration tests
tsx docs/scripts/test-database-integration.js
```

### Test Coverage Areas

- **Payment Processing**: ACH, card, direct deposit flows
- **Compliance**: Audit trail, regulatory reporting
- **Security**: Authentication, authorization, encryption
- **Blockchain**: Contract deployment, token operations
- **Database**: CRUD operations, transactions, migrations

---

## 🚢 Deployment

### Docker Deployment

The project uses Docker Compose for container orchestration:

```yaml
# docker-compose.yml (excerpt)
services:
  gateway:
    build: ./gateway
    ports:
      - "3002:3002"
    depends_on:
      - ledger-core
      - risk-service
    
  ledger-core:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/ORACLE_LEDGER
      
  db:
    image: postgres:16
    ports:
      - "5432:5432"
    volumes:
      - ./database-schema.sql:/docker-entrypoint-initdb.d/schema.sql
```

### Production Considerations

1. **Secrets Management**: Use environment variables or a secrets manager
2. **SSL/TLS**: Enable HTTPS in production
3. **Logging**: Centralize logs with ELK stack or similar
4. **Monitoring**: Set up Prometheus + Grafana
5. **Backups**: Automated database backups
6. **Health Checks**: Implement liveness and readiness probes

---

## 🔧 Troubleshooting

### Common Issues

#### 500 Internal Server Error (Logging)

If the ledger-core crashes on log flush:

```bash
# Verify system_logs table exists
docker exec -it oracle-ledger-main-db-1 psql -U postgres -d ORACLE_LEDGER -c "SELECT * FROM system_logs LIMIT 1;"

# If table doesn't exist, restart with fresh database
docker compose down -v
docker compose up --build -d
```

#### Port Conflicts

Ensure no local processes are using the following ports:

| Port | Service |
|------|---------|
| 3001 | Ledger Core |
| 3002 | API Gateway |
| 3003 | Risk Service |
| 3004 | Chain Service |
| 3005 | Payment Service |
| 5432 | PostgreSQL |

```bash
# Check for port usage (Windows)
netstat -ano | findstr "3001"

# Kill process if needed
taskkill /PID <process_id> /F
```

#### RPC Rate Limiting

The public Base Mainnet RPC may return `429 Too Many Requests`. 

**Solution**: Use Mock Mode in the System Console for testing:

1. Press `Ctrl + \`` to open the System Console
2. Toggle "Virtualization" to enable Mock Mode

### System Console Features

Access via the frontend (`Ctrl + \`` or console icon):

- **Live Logs**: Real-time frontend/backend logs
- **Mock Mode**: Switch between live and mock data
- **Network Status**: Monitor RPC connection health

---

## 🤝 Contributing

### Development Guidelines

1. **Follow the Architecture**: Maintain the microservices boundaries
2. **Write Tests**: All new features should include tests
3. **Document APIs**: Update API documentation for new endpoints
4. **Security First**: Never commit secrets or credentials

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use meaningful variable names
- Keep functions under 100 lines

### Submitting Changes

1. Create a feature branch
2. Make your changes
3. Run tests locally
4. Submit a pull request

---

## 📄 License & Support

### License

This project is proprietary software. All rights reserved.

### Support

For technical support and inquiries:

- **Documentation**: See `/docs` directory
- **Architecture**: See `/docs/ARCHITECTURE.md`
- **Operations**: See `/docs/OPERATIONS.md`

---

## 📊 System Status

| Component | Status | Port |
|-----------|--------|------|
| API Gateway | ● Active | 3002 |
| Ledger Core | ● Active | 3001 |
| Risk Service | ● Active | 3003 |
| Chain Service | ● Active | 3004 |
| Payment Service | ● Active | 3005 |
| Database | ● Active | 5432 |

---

## 🔗 Quick Reference Card

| Action | Command |
|--------|---------|
| Start all services | `docker compose up --build -d` |
| View logs | `docker compose logs -f` |
| Stop services | `docker compose down` |
| Reset database | `docker compose down -v` |
| Frontend only | `npm run dev` |
| Backend only | `npm run dev:backend` |
| All services (local) | `npm run dev:all` |
| Compile contracts | `npm run compile-contracts` |
| Database push | `npm run db:push` |

---

<div align="center">

### 🏛️ Oracle Ledger

*Enterprise Financial Management System*

**Version:** 1.0.0  
**Status:** Production Ready  
**Architecture:** Microservices (Docker)

---

*Built with ❤️ by the SOVR Development Team*

</div>

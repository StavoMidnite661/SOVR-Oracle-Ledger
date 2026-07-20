# Microservices

This directory contains the individual microservices that make up the Oracle Ledger backend.

## Services

| Service | Description | Port |
|---------|-------------|------|
| `gateway/` | API Gateway with routing, rate limiting, and security | 3002 |
| `risk-compliance/` | Risk assessment, PCI audit logging, compliance tools | 3003 |
| `blockchain-bridge/` | Base Mainnet integration and Consul Credits | 3004 |
| `payment-gateway/` | Stripe integration and ACH processing | 3005 |
| `bank-connector/` | Traditional banking rails integration | 3007 |

## Architecture Notes

- All services communicate via the internal `oracle-net` Docker network.
- Services use environment variables for configuration.
- The `gateway` service acts as the single entry point for external traffic.

## Running Individually

You can start a single service using:

```bash
docker compose up <service-name>
```

Example:
```bash
docker compose up gateway
```
import express from 'express';
import cors from 'cors';
import http from 'http';

// Import security middleware
import { securityHeaders, apiRateLimiter, sanitizeRequest } from '../../middleware/security.js';

// Configuration
const GATEWAY_PORT = process.env.GATEWAY_PORT || 3002;
const LEGACY_API_URL = process.env.LEGACY_API_URL || 'http://localhost:3001';
const RISK_SERVICE_URL = process.env.RISK_SERVICE_URL || 'http://localhost:3003';
const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3004';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';

// Service Registry
const SERVICES = {
  AUTH: LEGACY_API_URL,
  LEDGER: LEGACY_API_URL,
  BLOCKCHAIN: BLOCKCHAIN_SERVICE_URL,
  PAYMENT: PAYMENT_SERVICE_URL,
  RISK: RISK_SERVICE_URL
};

const app = express();

// ============================================
// SECURITY MIDDLEWARE (Enterprise Grade)
// ============================================
app.use(securityHeaders);
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeRequest);
app.use(apiRateLimiter);

// Helper to proxy requests
const proxyRequest = (targetUrl: string) => {
  return (req: express.Request, res: express.Response) => {
    const url = `${targetUrl}${req.originalUrl}`;
    
    console.log(`[Gateway] Proxying ${req.method} ${req.originalUrl} -> ${url}`);

    const options: any = {
      method: req.method,
      headers: { ...req.headers },
    };

    delete options.headers.host;

    const proxyReq = http.request(url, options, (proxyRes) => {
      console.log(`[Gateway] Response from ${url}: ${proxyRes.statusCode}`);
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Gateway] Proxy Error: ${err.message}`);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Bad Gateway', details: err.message });
      }
    });

    req.pipe(proxyReq, { end: true });
  };
};

// --- Route Definitions ---

// 1. Auth Service
app.use('/api/auth', proxyRequest(SERVICES.AUTH));

// 5. Risk & Compliance Service (Precedence over Stripe)
app.use('/api/stripe/audit', proxyRequest(SERVICES.RISK));
app.use('/api/stripe/compliance', proxyRequest(SERVICES.RISK));

// 3. Blockchain Bridge Service
app.use('/api/consul-credits-transactions', proxyRequest(SERVICES.BLOCKCHAIN));
app.use('/api/consul-credits', proxyRequest(SERVICES.BLOCKCHAIN));
app.use('/api/rpc', proxyRequest(SERVICES.BLOCKCHAIN));

// 4. Payment Gateway Service
app.use('/api/stripe', proxyRequest(SERVICES.PAYMENT));
// Specific payment routes
app.use('/api/v1/ach-payments', proxyRequest(SERVICES.PAYMENT));
app.use('/api/v1/direct-deposit', proxyRequest(SERVICES.PAYMENT));
app.use('/api/direct-deposit', proxyRequest(SERVICES.PAYMENT));
app.use('/api/stripe/ach', proxyRequest(SERVICES.PAYMENT));
app.use('/api/stripe/transactions', proxyRequest(SERVICES.PAYMENT));

// 5. Bank Connector Service
app.use('/api/bank', proxyRequest('http://localhost:3007'));

// 2. Ledger Core Service (Catch-all)
app.use('/api', proxyRequest(SERVICES.LEDGER));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', role: 'Gateway' });
});

app.listen(GATEWAY_PORT, () => {
  console.log(`🚀 API Gateway running on port ${GATEWAY_PORT}`);
  console.log(`   - Risk: ${SERVICES.RISK}`);
  console.log(`   - Blockchain: ${SERVICES.BLOCKCHAIN}`);
  console.log(`   - Payment: ${SERVICES.PAYMENT}`);
  console.log(`   - Legacy: ${LEGACY_API_URL}`);
});

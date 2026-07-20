import express from 'express';
import cors from 'cors';
import { db } from '../../server/db.js';
import * as schema from '../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import type { ConsulCreditsTransaction, ConsulCreditsConfig } from '../../types.js';
import { ConsulCreditsService } from '../../services/consulCreditsService.js';

const consulCreditsService = new ConsulCreditsService();

const app = express();
const PORT = process.env.BLOCKCHAIN_BRIDGE_PORT || 3004;

app.use(cors());
app.use(express.json());

// --- Middleware ---
const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.header('X-User-ID');
  const userEmail = req.header('X-User-Email');
  const userRole = req.header('X-User-Role') || 'user';
  
  console.log(`[Blockchain] Auth Request: ${req.method} ${req.url}`);
  
  // Allow CORS preflight, health checks, and RPC proxy (public blockchain data)
  if (req.method === 'OPTIONS' || req.path === '/health' || req.path.match(/^\/(api\/)?rpc/)) {
    return next();
  }

  console.log(`[Blockchain] Headers:`, JSON.stringify(req.headers));
  if (!userId || !userEmail) {
    console.log('[Blockchain] Auth Failed: Missing headers');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  (req as any).user = { id: userId, email: userEmail, role: userRole };
  next();
};

app.use(authenticateRequest);

// --- Routes ---

// GET /api/consul-credits-transactions
app.get('/api/consul-credits-transactions', async (req, res) => {
  try {
    const dbTransactions = await db.select().from(schema.consulCreditsTransactions).orderBy(desc(schema.consulCreditsTransactions.createdAt));
    res.json(dbTransactions);
  } catch (error) {
    console.error('Error fetching consul credits transactions:', error);
    res.status(500).json({ error: 'Failed to fetch consul credits transactions' });
  }
});

// POST /api/consul-credits-transactions
app.post('/api/consul-credits-transactions', async (req, res) => {
  try {
    const transaction = req.body as Omit<ConsulCreditsTransaction, 'id'>;
    const id = `CC-${Date.now()}`;
    const [newTransaction] = await db.insert(schema.consulCreditsTransactions)
      .values({ 
        id, 
        txHash: transaction.txHash,
        blockNumber: transaction.blockNumber,
        timestamp: new Date(transaction.timestamp),
        eventType: transaction.eventType,
        userAddress: transaction.userAddress,
        tokenAddress: transaction.tokenAddress,
        tokenSymbol: transaction.tokenSymbol,
        tokenAmount: transaction.tokenAmount.toString(),
        consulCreditsAmount: transaction.consulCreditsAmount.toString(),
        exchangeRate: transaction.exchangeRate?.toString(),
        ledgerReference: transaction.ledgerReference,
        journalEntryId: transaction.journalEntryId,
        confirmations: transaction.confirmations,
        status: transaction.status
      })
      .returning();
    res.json(newTransaction);
  } catch (error) {
    console.error('Error adding consul credits transaction:', error);
    res.status(500).json({ error: 'Failed to add consul credits transaction' });
  }
});

// Helper to get config
async function getConsulCreditsConfig() {
  try {
    const configs = await db.select().from(schema.consulCreditsConfig).limit(1);
    
    if (configs.length > 0) {
      let config = configs[0];
      
      // Auto-migrate to Base Mainnet if it's still on Sepolia (any variant) or uses the old broken contract
      const STALE_ADDRESS = '0x18042545890dd72c4023EE8eb22B14bAbb034666';
      const CORRECT_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422'; // usdSOVR on Base

      if (config.networkName.includes('Sepolia') || config.chainId === 11155111 || config.contractAddress === STALE_ADDRESS) {
        try {
          const [updated] = await db.update(schema.consulCreditsConfig)
            .set({
              networkName: 'Base Mainnet',
              chainId: 8453,
              contractAddress: CORRECT_ADDRESS, 
              rpcUrl: '/api/rpc', // Use local proxy
              oracleIntegratorAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
              confirmationsRequired: 3,
              updatedAt: new Date()
            })
            .where(eq(schema.consulCreditsConfig.id, config.id))
              .returning();
              
          if (updated) config = updated;
        } catch (err) {
          console.error('[Blockchain] Migration failed:', err);
        }
      }
      return config;
    }
  } catch (err) {
    console.warn('[Blockchain] Could not fetch config from DB, falling back to ENV variables. Error:', err.message);
  }
  
  return {
    isEnabled: process.env.CONSUL_CREDITS_ENABLED === 'true' || true,
    networkName: process.env.CONSUL_CREDITS_NETWORK || 'Base Mainnet',
    chainId: parseInt(process.env.CONSUL_CREDITS_CHAIN_ID || '8453'),
    contractAddress: process.env.CONSUL_CREDITS_CONTRACT || '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422',
    rpcUrl: '/api/rpc',
    oracleIntegratorAddress: process.env.ORACLE_INTEGRATOR_ADDRESS || '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
    confirmationsRequired: parseInt(process.env.CONSUL_CREDITS_CONFIRMATIONS || '3')
  };
}

// GET /api/consul-credits/config
app.get('/api/consul-credits/config', async (req, res) => {
  try {
    const config = await getConsulCreditsConfig();
    res.json(config);
  } catch (error) {
    console.error('Error fetching consul credits config:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// --- Oracle Operations ---

// POST /api/consul-credits/mint
app.post('/api/consul-credits/mint', async (req, res) => {
  try {
    const { toAddress, amount, ledgerReference } = req.body;
    const signerKey = process.env.ORACLE_INTEGRATOR_PRIVATE_KEY || process.env.BLOCKCHAIN_SIGNER_KEY;

    if (!signerKey) {
      return res.status(500).json({ error: 'Signer key not configured on server' });
    }

    // Ensure service is initialized
    if (!consulCreditsService.isInitialized()) {
      const config = await getConsulCreditsConfig();
      await consulCreditsService.initialize(config);
    }

    console.log(`[Blockchain] Sovereign Mint: ${amount} usdSOVR to ${toAddress} (Ref: ${ledgerReference})`);
    const txHash = await consulCreditsService.sovereignMint(toAddress, amount, ledgerReference, signerKey);
    
    res.json({ success: true, txHash, ledgerReference });
  } catch (error: any) {
    console.error('Error in sovereign mint:', error);
    res.status(500).json({ error: 'Failed to mint credits', details: error.message });
  }
});

// POST /api/consul-credits/burn
app.post('/api/consul-credits/burn', async (req, res) => {
  try {
    const { amount, ledgerReference } = req.body;
    const signerKey = process.env.ORACLE_INTEGRATOR_PRIVATE_KEY || process.env.BLOCKCHAIN_SIGNER_KEY;

    if (!signerKey) {
      return res.status(500).json({ error: 'Signer key not configured on server' });
    }

    if (!consulCreditsService.isInitialized()) {
      const config = await getConsulCreditsConfig();
      await consulCreditsService.initialize(config);
    }

    console.log(`[Blockchain] Sovereign Burn: ${amount} usdSOVR (Ref: ${ledgerReference})`);
    // Burns from the owner's balance — no fromAddress needed, burn() burns from caller
    const txHash = await consulCreditsService.sovereignBurn(amount, ledgerReference, signerKey);
    
    res.json({ success: true, txHash, ledgerReference });
  } catch (error: any) {
    console.error('Error in sovereign burn:', error);
    res.status(500).json({ error: 'Failed to burn credits', details: error.message });
  }
});

// GET /api/consul-credits/balance/:address
app.get('/api/consul-credits/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!consulCreditsService.isInitialized()) {
      const config = await getConsulCreditsConfig();
      await consulCreditsService.initialize(config);
    }

    const balance = await consulCreditsService.getUserBalance(address);
    res.json({ balance });
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance', details: error.message });
  }
});

// POST /api/consul-credits/config
app.post('/api/consul-credits/config', async (req, res) => {
  try {
    const config = req.body as ConsulCreditsConfig;
    
    const existingConfigs = await db.select().from(schema.consulCreditsConfig).limit(1);
    
    let result;
    if (existingConfigs.length > 0) {
      result = await db.update(schema.consulCreditsConfig)
        .set(config)
        .where(eq(schema.consulCreditsConfig.id, existingConfigs[0].id))
        .returning();
    } else {
      result = await db.insert(schema.consulCreditsConfig)
        .values({ id: 'default', ...config })
        .returning();
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating consul credits config:', error);
    res.status(500).json({ error: 'Failed to update consul credits config' });
  }
  });

// --- Simple Cache Implementation ---
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 10000; // 10 seconds cache for READ calls

// POST /api/rpc (Proxy to external RPC to bypass CORS + Caching)
app.post(['/api/rpc', '/rpc'], async (req, res) => {
  // Use a rotating/fallback list of public Base RPCs
  const PUBLIC_RPCS = [
    process.env.ETHEREUM_RPC_URL || 'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://1rpc.io/base',
    'https://base.drpc.org',
    'https://base-mainnet.public.blastapi.io'
  ].filter((v, i, a) => a.indexOf(v) === i); // Dedupe

  try {
    const isBatch = Array.isArray(req.body);
    const requests = isBatch ? req.body : [req.body];
    
    // 1. Check Cache for single requests
    if (!isBatch) {
      const { method, params, id } = req.body;
      const isCacheable = method === 'eth_call' || 
                          method === 'eth_chainId' || 
                          method === 'net_version' || 
                          method === 'eth_blockNumber' || 
                          method === 'eth_getLogs';

      if (isCacheable) {
        const safeParams = JSON.stringify(params);
        const cacheKey = `${method}:${safeParams}`;
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
          console.log(`[Blockchain] Cache HIT: ${method}`);
          return res.json({ ...cached.data, id });
        }
      }
    }

    // 2. Multi-RPC Proxy Logic
    let lastError;
    for (const rpcUrl of PUBLIC_RPCS) {
      console.log(`[Blockchain] Proxying ${isBatch ? 'BATCH ' : ''}RPC request to: ${rpcUrl}`);
      
      let response;
      let retries = 2;
      
      while (retries >= 0) {
        try {
          response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
          });

          if (response.status === 429) {
            console.warn(`[Blockchain] Rate Limited (429) on ${rpcUrl}. Retries left: ${retries}`);
            if (retries === 0) break;
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            retries--;
            continue;
          }
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} from ${rpcUrl}`);
          }
          
          const data = await response.json();
          
          // Check for specific RPC-level errors that warrant a fallback
          if (data.error && (
              data.error.message?.includes('no backend') || 
              data.error.message?.includes('healthy') ||
              data.error.code === -32011 ||
              data.error.code === -32005
          )) {
              console.warn(`[Blockchain] Upstream Node Error on ${rpcUrl}: ${data.error.message}. Trying next RPC...`);
              throw new Error(`RPC Node Error: ${data.error.message}`);
          }

          // SUCCESS - Process and cache results
          if (!isBatch && !data.error) {
            const { method, params } = req.body;
            const isCacheable = method === 'eth_call' || 
                                method === 'eth_chainId' || 
                                method === 'net_version' || 
                                method === 'eth_blockNumber' || 
                                method === 'eth_getLogs';
            if (isCacheable) {
              const cacheKey = `${method}:${JSON.stringify(params)}`;
              cache.set(cacheKey, { data, timestamp: Date.now() });
              if (cache.size > 1000) cache.delete(cache.keys().next().value);
            }
          }
          
          return res.json(data);
        } catch (err: any) {
          lastError = err;
          console.error(`[Blockchain] Failed with RPC ${rpcUrl}:`, err.message);
          break; // Exit retry loop and move to next RPC URL
        }
      }
    }

    throw new Error(`All available RPC endpoints failed. Last error: ${lastError?.message}`);
  } catch (error: any) {
    console.error('[Blockchain] Critical RPC Proxy Failure:', error.message);
    res.status(502).json({ error: 'RPC Proxy Exhausted', details: error.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Blockchain Bridge' });
});

// Debug Catch-all
app.use((req, res) => {
  console.log(`[Blockchain] 404 UNMATCHED: ${req.method} ${req.url}`);
  res.status(404).send(`Cannot ${req.method} ${req.url} (Blockchain Service Fallthrough)`);
});

app.listen(PORT, () => {
  console.log(`🔗 Blockchain Bridge Service running on port ${PORT}`);
});

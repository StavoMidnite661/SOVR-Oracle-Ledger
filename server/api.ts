import express from 'express';
import cors from 'cors';
import { db } from './db.ts';
import bodyParser from 'body-parser';
import * as schema from '../shared/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import type { 
  Employee, 
  JournalEntry, 
  Vendor, 
  CompanyCard, 
  CardTransaction, 
  PurchaseOrder, 
  Invoice,
  Entity
} from '../types.js';
import { SpendCategory } from '../types.js';

const app = express();

// --- Middleware ---

const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.method === 'OPTIONS' || req.path === '/api/health' || req.path === '/api/logs' || req.path.startsWith('/api/direct-deposit')) {
    return next();
  }
  
  const userId = req.header('X-User-ID');
  const userEmail = req.header('X-User-Email');
  const userRole = req.header('X-User-Role') || 'user';
  
  if (!userId || !userEmail) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  (req as any).user = { id: userId, email: userEmail, role: userRole };
  next();
};

const requireRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(authenticateRequest);

// --- Conversion Utilities ---

function parseNumeric(value: string | number): number {
  return typeof value === 'string' ? parseFloat(value) : value;
}

function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function mapSpendCategory(dbCategory: string): SpendCategory {
  const categoryMap: Record<string, SpendCategory> = {
    'Fuel': SpendCategory.Fuel,
    'Office': SpendCategory.Office,
    'Travel': SpendCategory.Travel,
    'Software': SpendCategory.Software,
    'Hardware': SpendCategory.Equipment,
    'Other': SpendCategory.Other
  };
  return categoryMap[dbCategory] || SpendCategory.Other;
}

function convertDbEmployee(dbEmployee: any): Employee {
  return {
    id: dbEmployee.id,
    name: dbEmployee.name,
    annualSalary: parseNumeric(dbEmployee.annualSalary),
    bankRoutingNumber: dbEmployee.bankRoutingNumber,
    bankAccountNumber: dbEmployee.bankAccountNumber,
    paymentMethod: dbEmployee.paymentMethod,
    taxId: dbEmployee.taxId
  };
}

function convertDbJournalLine(dbLine: any): any {
  return {
    accountId: dbLine.accountId,
    type: dbLine.type,
    amount: parseNumeric(dbLine.amount)
  };
}

function convertDbJournalEntry(dbEntry: any, dbLines: any[]): JournalEntry {
  return {
    id: dbEntry.id,
    date: dbEntry.date,
    description: dbEntry.description,
    source: dbEntry.source as any,
    status: dbEntry.status as any,
    lines: dbLines.map(convertDbJournalLine)
  };
}

function convertDbVendor(dbVendor: any): Vendor {
  return {
    id: dbVendor.id,
    name: dbVendor.name,
    contactPerson: dbVendor.contactPerson,
    email: dbVendor.email,
    phone: dbVendor.phone,
    address: dbVendor.address,
    paymentTerms: dbVendor.paymentTerms,
    bankAccountNumber: dbVendor.bankAccountNumber,
    bankRoutingNumber: dbVendor.bankRoutingNumber,
    taxId: dbVendor.taxId,
    status: dbVendor.status,
    category: dbVendor.category,
    notes: dbVendor.notes,
    createdDate: formatDateToISO(dbVendor.createdAt)
  };
}

function convertDbCompanyCard(dbCard: any): CompanyCard {
  return {
    id: dbCard.id,
    cardNumber: { last4: dbCard.last4, providerTokenId: dbCard.providerTokenId },
    cardType: dbCard.cardType,
    cardProvider: dbCard.cardProvider,
    assignedTo: dbCard.assignedTo,
    assignedEntity: 'SOVR Development Holdings LLC' as Entity,
    status: dbCard.status as any,
    monthlyLimit: parseNumeric(dbCard.spendingLimitMonthly || 0),
    dailyLimit: parseNumeric(dbCard.spendingLimitDaily || 0),
    transactionLimit: parseNumeric(dbCard.spendingLimitTransaction || 0),
    spentThisMonth: 0,
    spentThisQuarter: 0,
    spentThisYear: 0,
    allowedCategories: [],
    blockedCategories: [],
    expirationDate: dbCard.expiryDate,
    issueDate: dbCard.issueDate,
    billingAddress: ''
  };
}

function convertDbCardTransaction(dbTransaction: any): CardTransaction {
  return {
    id: dbTransaction.id,
    cardId: dbTransaction.cardId,
    merchantName: dbTransaction.merchantName,
    merchantCategory: mapSpendCategory(dbTransaction.merchantCategory),
    amount: parseNumeric(dbTransaction.amount),
    currency: dbTransaction.currency,
    transactionDate: dbTransaction.transactionDate,
    postingDate: dbTransaction.postingDate,
    description: dbTransaction.description,
    status: dbTransaction.status,
    location: dbTransaction.location,
    accountingCode: dbTransaction.accountingCode,
    notes: dbTransaction.notes
  };
}

function convertDbPurchaseOrder(dbOrder: any, dbItems: any[]): PurchaseOrder {
  return {
    id: dbOrder.id,
    vendor: dbOrder.vendor,
    date: dbOrder.date,
    items: dbItems.map(i => ({ description: i.description, amount: parseNumeric(i.amount) })),
    totalAmount: parseNumeric(dbOrder.totalAmount),
    status: dbOrder.status
  };
}

function convertDbInvoice(dbInvoice: any): Invoice {
  return {
    id: dbInvoice.id,
    type: dbInvoice.type,
    counterparty: dbInvoice.counterparty,
    issueDate: dbInvoice.issueDate,
    dueDate: dbInvoice.dueDate,
    amount: parseNumeric(dbInvoice.amount),
    status: dbInvoice.status
  };
}

// --- API Routes ---

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const data = await db.select().from(schema.employees).orderBy(desc(schema.employees.createdAt));
    res.json(data.map(convertDbEmployee));
  } catch (error) {
    console.error('Employees query error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employee = req.body;
    const id = `EMP-${Date.now()}`;
    const [newEmployee] = await db.insert(schema.employees).values({ id, ...employee, annualSalary: employee.annualSalary.toString() }).returning();
    res.json(convertDbEmployee(newEmployee));
  } catch (error) {
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// Journal Entries
app.get('/api/journal-entries', async (req, res) => {
  try {
    const entries = await db.select().from(schema.journalEntries).orderBy(desc(schema.journalEntries.createdAt));
    const result = await Promise.all(entries.map(async (entry) => {
      const lines = await db.select().from(schema.journalLines).where(eq(schema.journalLines.journalEntryId, entry.id));
      return convertDbJournalEntry(entry, lines);
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const data = await db.select().from(schema.vendors).orderBy(desc(schema.vendors.createdAt));
    res.json(data.map(convertDbVendor));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    const vendor = req.body;
    const id = `VEN-${Date.now()}`;
    const [newVendor] = await db.insert(schema.vendors).values({ 
      id, 
      ...vendor,
      createdAt: new Date()
    }).returning();
    res.json(convertDbVendor(newVendor));
  } catch (error) {
    console.error('Failed to add vendor:', error);
    res.status(500).json({ error: 'Failed to add vendor' });
  }
});

app.put('/api/vendors/:id', async (req, res) => {
  try {
    const [updated] = await db.update(schema.vendors)
      .set(req.body)
      .where(eq(schema.vendors.id, req.params.id))
      .returning();
    res.json(convertDbVendor(updated));
  } catch (error) {
    console.error('Failed to update vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});


// Company Cards & Transactions
app.get('/api/company-cards', async (req, res) => {
  try {
    const data = await db.select().from(schema.companyCards).orderBy(desc(schema.companyCards.createdAt));
    res.json(data.map(convertDbCompanyCard));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

app.get('/api/card-transactions', async (req, res) => {
  try {
    const data = await db.select().from(schema.cardTransactions).orderBy(desc(schema.cardTransactions.createdAt));
    res.json(data.map(convertDbCardTransaction));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const orders = await db.select().from(schema.purchaseOrders).orderBy(desc(schema.purchaseOrders.createdAt));
    const result = await Promise.all(orders.map(async (order) => {
      const items = await db.select().from(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.purchaseOrderId, order.id));
      return convertDbPurchaseOrder(order, items);
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const { items, ...poData } = req.body;
    const id = `PO-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    
    // Create PO
    const [newPO] = await db.insert(schema.purchaseOrders).values({
      id,
      ...poData,
      date,
      totalAmount: poData.totalAmount.toString()
    }).returning();

    // Create Items
    const createdItems = [];
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const [newItem] = await db.insert(schema.purchaseOrderItems).values({
          purchaseOrderId: id,
          description: item.description,
          amount: item.amount.toString()
        }).returning();
        createdItems.push(newItem);
      }
    }

    res.json(convertDbPurchaseOrder(newPO, createdItems));
  } catch (error) {
    console.error('Failed to add PO:', error);
    res.status(500).json({ error: 'Failed to add purchase order' });
  }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const data = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
    res.json(data.map(convertDbInvoice));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const [updated] = await db.update(schema.invoices).set(req.body).where(eq(schema.invoices.id, req.params.id)).returning();
    res.json(convertDbInvoice(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// System Logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await db.select().from(schema.systemLogs).orderBy(desc(schema.systemLogs.timestamp)).limit(500);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const log = req.body;
    const [newLog] = await db.insert(schema.systemLogs).values({
      ...log,
      timestamp: new Date()
    }).returning();
    res.json(newLog);
  } catch (error) {
    console.error('Failed to save log:', error);
    res.status(500).json({ error: 'Failed to save system log' });
  }
});

app.post('/api/logs/batch', async (req, res) => {
  try {
    const { logs } = req.body;
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.json({ count: 0 });
    }

    const logsToInsert = logs.map(log => ({
      ...log,
      timestamp: new Date()
    }));

    const result = await db.insert(schema.systemLogs).values(logsToInsert).returning();
    res.json({ count: result.length, logs: result });
  } catch (error) {
    console.error('Failed to save batch logs:', error);
    res.status(500).json({ error: 'Failed to save batch system logs' });
  }
});

// Compliance & Regulatory
app.get('/api/compliance/standards', async (req, res) => {
  try {
    const data = await db.select().from(schema.complianceStandards).orderBy(desc(schema.complianceStandards.createdAt));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance standards' });
  }
});

app.get('/api/compliance/requirements', async (req, res) => {
  try {
    const data = await db.select().from(schema.regulatoryRequirements).orderBy(desc(schema.regulatoryRequirements.createdAt));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch regulatory requirements' });
  }
});

app.get('/api/compliance/changes', async (req, res) => {
  try {
    const data = await db.select().from(schema.regulatoryChanges).orderBy(desc(schema.regulatoryChanges.announcementDate));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch regulatory changes' });
  }
});

app.get('/api/compliance/gaps', async (req, res) => {
  try {
    const data = await db.select().from(schema.complianceGaps).orderBy(desc(schema.complianceGaps.identifiedDate));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance gaps' });
  }
});

app.get('/api/compliance/policies', async (req, res) => {
  try {
    const data = await db.select().from(schema.compliancePolicies).orderBy(desc(schema.compliancePolicies.createdAt));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance policies' });
  }
});

app.get('/api/reconciliation', async (req, res) => {
  try {
    const data = await db.select().from(schema.paymentReconciliation).orderBy(desc(schema.paymentReconciliation.createdAt));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reconciliation records' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', data: [1, 2, 3] });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Ledger Core & Auth', testData: [1, 2, 3] });
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🏛️ Ledger Core & Auth Service running on port ${PORT}`);
});
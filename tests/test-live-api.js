#!/usr/bin/env node

// Test API endpoints to verify live data loading works
// This simulates what the frontend would receive

const API_BASE = 'http://localhost:5000';
const AUTH_HEADERS = {
  'X-User-ID': 'admin-user',
  'X-User-Email': 'admin@sovr.test',
  'X-User-Role': 'admin'
};

async function testEndpoint(path, description) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: AUTH_HEADERS
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    console.log(`✅ ${description}: ${response.status} - ${Array.isArray(data) ? data.length + ' items' : typeof data} - ${!response.ok ? 'ERROR' : 'OK'}`);
    
    if (!response.ok) {
      console.log(`   Error: ${data?.error || data}`);
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log(`❌ ${description}: FAILED - ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('🧪 Oracle Ledger Live API Test');
  console.log('===============================\n');
  
  const tests = [
    ['/api/health', 'Health Check'],
    ['/api/employees', 'Employees'],
    ['/api/vendors', 'Vendors'],
    ['/api/journal-entries', 'Journal Entries'],
    ['/api/company-cards', 'Company Cards'],
    ['/api/card-transactions', 'Card Transactions'],
    ['/api/purchase-orders', 'Purchase Orders'],
    ['/api/invoices', 'Invoices'],
    ['/api/consul-credits/config', 'Consul Credits Config'],
    ['/api/stripe/customers', 'Stripe Customers']
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [path, description] of tests) {
    const result = await testEndpoint(path, description);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All API endpoints are working! Live data is flowing.');
  } else {
    console.log('⚠️  Some endpoints have issues - check above');
  }
}

runTests().catch(console.error);
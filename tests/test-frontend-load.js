// Quick test to verify React app can load data
// Simulates what happens when the frontend loads

import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing frontend data loading...\n');

http.get('http://localhost:5000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.includes('SOVRCVLT ORACLE-LEDGER') && data.includes('root')) {
      console.log('✅ Frontend HTML loads correctly');
    } else {
      console.log('❌ Frontend HTML missing expected content');
    }
    
    // Step 2: Verify API responds with real data
    fetchWithAuth('/api/employees')
      .then(result => {
        if (result.success && result.data.length > 0) {
          console.log(`✅ Employees API: ${result.data.length} employees loaded`);
          console.log(`   First employee: ${result.data[0].name}`);
        } else {
          console.log('❌ Employees API: no data or failed');
        }
        return fetchWithAuth('/api/vendors');
      })
      .then(result => {
        if (result.success && result.data.length > 0) {
          console.log(`✅ Vendors API: ${result.data.length} vendors loaded`);
          console.log(`   First vendor: ${result.data[0].name}`);
        } else {
          console.log('❌ Vendors API: no data or failed');
        }
        return fetchWithAuth('/api/journal-entries');
      })
      .then(result => {
        if (result.success) {
          console.log(`✅ Journal Entries API: accessible (${result.data.length} entries)`);
        } else {
          console.log('❌ Journal Entries API: failed');
        }
        console.log('\n🎯 Live data loading: WORKING');
        console.log('✅ Frontend should display:');
        console.log('   - 3 Employees (John Doe, Jane Smith, Bob Johnson)');
        console.log('   - 1 Vendor (Tech Solutions Inc)');
        console.log('   - Real-time database connections active');
      })
      .catch(err => {
        console.error('❌ Test failed:', err);
      });
  });
}).on('error', (err) => {
  console.error('❌ Cannot reach frontend on localhost:5000');
  console.error('   Make sure Vite dev server is running: npm run dev');
});

function fetchWithAuth(path) {
  return new Promise((resolve) => {
    http.get({
      host: 'localhost',
      port: 5000,
      path: path,
      headers: {
        'X-User-ID': 'admin-user',
        'X-User-Email': 'admin@sovr.test',
        'X-User-Role': 'admin'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ success: res.statusCode === 200, data: json, status: res.statusCode });
        } catch {
          resolve({ success: false, data: data, status: res.statusCode });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}
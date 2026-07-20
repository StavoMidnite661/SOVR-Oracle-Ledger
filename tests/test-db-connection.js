
import pg from 'pg';
const passes = [
  'sovr', 
  'SOVR.Empire661', 
  'sovereignty_is_mechanical', 
  'K8vP2xZ9mN7qR4sL3tU6wE1aB8cD5fG2hJ9kM4nP7qR1sT5uV8wX0yZ3aB6cD9f', 
  'postgres', 
  'password', 
  'admin'
];

(async () => {
  for (const pass of passes) {
    try {
      const client = new pg.Client(`postgresql://postgres:${pass}@localhost:5432/postgres`);
      await client.connect();
      console.log('SUCCESS: ' + pass);
      await client.end();
      return;
    } catch (e) {
      console.log('FAILED: ' + pass + ' - ' + e.message);
    }
  }
})();

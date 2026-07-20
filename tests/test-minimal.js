// Minimal server test
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// Simple health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Test Server' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🏛️ Test Server running on port ${PORT}`);
});
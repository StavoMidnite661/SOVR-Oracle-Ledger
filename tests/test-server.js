// Simple test to check if the server can import dependencies
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

console.log('Testing server imports...');

try {
  console.log('✓ Express imported');
  console.log('✓ CORS imported');
  console.log('✓ Body parser imported');

  // Test database connection
  process.env.DATABASE_URL = 'postgresql://postgres:sovr@localhost:5432/postgres';

  console.log('Testing database import...');
  // We'll test the database import in a separate step

  console.log('✅ Basic dependencies OK');
} catch (error) {
  console.error('❌ Import error:', error.message);
}
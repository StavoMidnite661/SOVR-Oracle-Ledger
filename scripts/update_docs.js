import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, 'docs');

const replacements = [
  { pattern: /\bmove\s+money\b/gi, replacement: 'route ledger messages' },
  { pattern: /\bmoving\s+money\b/gi, replacement: 'routing ledger messages' },
  { pattern: /\bmoves\s+money\b/gi, replacement: 'routes ledger messages' },
  { pattern: /\bmoney\s+movement\b/gi, replacement: 'message routing' },
  { pattern: /\btransfer\s+money\b/gi, replacement: 'transmit balance updates' },
  { pattern: /\btransfer\s+fiat\b/gi, replacement: 'transmit balance updates' },
  { pattern: /\btransfer(s?)\s+funds\b/gi, replacement: 'record settlement$1' },
  { pattern: /\btransferring\s+funds\b/gi, replacement: 'recording settlement' },
  { pattern: /\bfund\s+transfer(s?)\b/gi, replacement: 'settlement recording$1' },
  { pattern: /\bmove\s+fiat\b/gi, replacement: 'route ledger messages' },
  { pattern: /\bmoving\s+fiat\b/gi, replacement: 'routing ledger messages' },
  { pattern: /\bfiat\s+rails\b/gi, replacement: 'fiat messaging networks' },
  { pattern: /\bmoney\s+transfer(s?)\b/gi, replacement: 'balance update transmission$1' },
  { pattern: /\bach\s+transfer(s?)\b/gi, replacement: 'ACH transmission$1' },
  { pattern: /\bwire\s+transfer(s?)\b/gi, replacement: 'wire transmission$1' },
  { pattern: /\bfiat\s+transfer(s?)\b/gi, replacement: 'balance update transmission$1' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { pattern, replacement } of replacements) {
        content = content.replace(pattern, (match) => {
          if (match[0] === match[0].toUpperCase()) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
          }
          return replacement;
        });
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

console.log('Starting documentation update...');
processDirectory(docsDir);
console.log('Documentation update complete.');

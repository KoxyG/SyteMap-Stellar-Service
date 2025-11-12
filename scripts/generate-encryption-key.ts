#!/usr/bin/env ts-node

/**
 * Generate Master Encryption Key
 *
 * This script generates a secure master encryption key
 * for use with the encryption service.
 *
 * Usage:
 *   npm run generate:key
 *   or
 *   ts-node scripts/generate-encryption-key.ts
 */

import * as crypto from 'crypto';

console.log('\n🔐 Generating a New Master Encryption Key...\n');

// Generate key
const masterKey = crypto.randomBytes(32).toString('base64');

console.log('✅ Key generated successfully!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Add this to your .env file:\n');
console.log(`MASTER_ENCRYPTION_KEY=${masterKey}`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('   1. Keep this key SECRET - never commit to version control');
console.log('   2. Store securely in production (AWS Secrets Manager, etc.)');
console.log('   3. Losing this key means you cannot decrypt existing data');
console.log('   4. Use different keys for dev/staging/production');
console.log('\n');

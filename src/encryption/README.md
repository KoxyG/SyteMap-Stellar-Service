# Encryption Service

High-security encryption service using **AES-256-GCM** with **PBKDF2** key derivation.

## Security Features

- ✅ **AES-256-GCM**: Authenticated encryption with Galois/Counter Mode
- ✅ **PBKDF2**: Password-Based Key Derivation Function 2 (100,000 iterations)
- ✅ **Random Salt**: Unique salt per encryption operation
- ✅ **Random IV**: Unique initialization vector per encryption
- ✅ **Authentication Tag**: Ensures data integrity and authenticity
- ✅ **Base64 Encoding**: Safe for database storage and transmission

## Setup

### 1. Generate Master Key

Run this once to generate your master encryption key:

```bash
node -e "console.log('MASTER_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Add to Environment

Add the generated key to your `.env` file:

```bash
MASTER_ENCRYPTION_KEY=your_generated_base64_key_here
```

**⚠️ IMPORTANT:**

- Keep this key secure and never commit it to version control
- Store it in a secure secrets manager in production
- Losing this key means you cannot decrypt existing data

## Usage

### Encrypting Secret Keys

```typescript
import encryptionService from './encryption';

// Encrypt a Stellar private key
const privateKey = 'SXYZ...';
const encrypted = await encryptionService.encryptSecretKey(privateKey);
// Returns: base64 string containing salt+iv+tag+encrypted data

// Save encrypted to database
await wallet.update({ account_private_key: encrypted });
```

### Decrypting Secret Keys

```typescript
import encryptionService from './encryption';

// Get encrypted key from database
const wallet = await WalletAccount.findByPk(id);

// Decrypt the private key
const privateKey = await encryptionService.decryptSecretKey(wallet.account_private_key);
// Returns: original private key string
```

### Hashing (One-Way)

```typescript
import encryptionService from './encryption';

// Hash a password (SHA-256)
const hashedPassword = encryptionService.hash('myPassword123');

// Compare password
const isValid = encryptionService.compareHash('myPassword123', hashedPassword);
console.log(isValid); // true
```

### Generate Secure Tokens

```typescript
import encryptionService from './encryption';

// Generate a random token (e.g., for API keys, session tokens)
const token = encryptionService.generateSecureToken(32);
console.log(token); // URL-safe base64 string
```

## API Reference

### `encryptSecretKey(text: string): Promise<string>`

Encrypts sensitive data using AES-256-GCM.

**Parameters:**

- `text` - Plain text to encrypt

**Returns:**

- Base64 encoded string containing: `salt + iv + authTag + encrypted data`

**Throws:**

- Error if text is empty
- Error if encryption fails

---

### `decryptSecretKey(encryptedText: string): Promise<string>`

Decrypts data encrypted with `encryptSecretKey()`.

**Parameters:**

- `encryptedText` - Base64 encoded encrypted string

**Returns:**

- Original plain text

**Throws:**

- Error if encrypted text is invalid
- Error if authentication fails (data tampered)
- Error if decryption fails

---

### `hash(text: string): string`

Creates a SHA-256 hash (one-way, cannot be decrypted).

**Parameters:**

- `text` - Text to hash

**Returns:**

- Hex-encoded SHA-256 hash (64 characters)

---

### `compareHash(plainText: string, hashedText: string): boolean`

Compares plain text with a hash (timing-safe).

**Parameters:**

- `plainText` - Original text
- `hashedText` - Hash to compare against

**Returns:**

- `true` if they match, `false` otherwise

---

### `generateSecureToken(length?: number): string`

Generates a cryptographically secure random token.

**Parameters:**

- `length` - Length in bytes (default: 32)

**Returns:**

- URL-safe base64 encoded token

---

### `static generateMasterKey(): string`

Generates a new master encryption key.

**Returns:**

- Base64 encoded 32-byte key

**Usage:**

```typescript
const masterKey = EncryptionService.generateMasterKey();
console.log(masterKey);
```

## Format Details

### Encrypted Data Format

```
[salt (16 bytes)][iv (12 bytes)][authTag (16 bytes)][encrypted data (variable)]
```

All combined and base64 encoded for storage.

### Why This Format?

1. **Salt**: Ensures same plaintext encrypts differently each time
2. **IV (Initialization Vector)**: Required for GCM mode, must be unique
3. **Auth Tag**: Verifies data hasn't been tampered with
4. **Encrypted Data**: The actual encrypted content

## Security Best Practices

### ✅ DO:

- Use this service for all sensitive data (private keys, mnemonics, tokens)
- Store master key in secure secrets manager (AWS Secrets Manager, Azure Key Vault)
- Rotate master key periodically (requires re-encrypting all data)
- Use environment variables, never hardcode keys
- Test encryption/decryption in your CI/CD pipeline

### ❌ DON'T:

- Don't commit master key to version control
- Don't use same key across environments (dev/staging/prod)
- Don't expose encrypted data without authentication
- Don't decrypt more often than necessary
- Don't log decrypted values

## Testing

Run the test suite:

```bash
npm test src/encryption/tests/encryption.service.test.ts
```

Tests cover:

- Encryption/decryption correctness
- Multiple encryptions of same data produce different outputs
- Long text and special characters
- Error handling
- Hashing and comparison
- Token generation
- Master key generation

## Migration from Old Encryption

If you have data encrypted with the old system:

```typescript
// Old: import from lib/encryption
import oldEncryptionService from './lib/encryption/encryption.service';

// New: import from encryption
import encryptionService from './encryption';

// Decrypt with old service
const plainText = oldEncryptionService.decrypt(oldEncrypted);

// Re-encrypt with new service
const newEncrypted = await encryptionService.encryptSecretKey(plainText);

// Update database
await wallet.update({ account_private_key: newEncrypted });
```

## Performance

- **Encryption**: ~5-10ms per operation
- **Decryption**: ~5-10ms per operation
- **PBKDF2 Key Derivation**: ~100ms (intentionally slow for security)

The slow key derivation makes brute-force attacks impractical.

## Troubleshooting

### "MASTER_ENCRYPTION_KEY is not defined"

**Solution:** Set the environment variable in your `.env` file.

### "Failed to decrypt secret key"

**Possible causes:**

1. Wrong master key
2. Data corrupted
3. Encrypted with different key
4. Invalid base64 format

### "Encryption failed"

**Possible causes:**

1. Empty text provided
2. Master key not initialized
3. Insufficient memory

## References

- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [AES-GCM Wikipedia](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [PBKDF2 Wikipedia](https://en.wikipedia.org/wiki/PBKDF2)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

**Implementation based on production encryption service from api.fastbuka.com**

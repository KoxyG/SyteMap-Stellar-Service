# 🌟 Stellar Service

Production-ready Stellar blockchain integration service for Node.js/TypeScript applications.

## Features

- ✅ **Keypair Generation**: Create secure Stellar keypairs
- ✅ **Account Management**: Create, fund, and manage Stellar accounts
- ✅ **Payments**: Send XLM and custom assets
- ✅ **Balance Queries**: Check account balances
- ✅ **Transaction History**: Retrieve payment and transaction history
- ✅ **Testnet Support**: Built-in Friendbot integration
- ✅ **Mainnet Ready**: Production-ready configuration
- ✅ **Type-Safe**: Full TypeScript support

## Setup

### 1. Configure Environment

Add to your `.env` file:

```bash
# Stellar Configuration
STELLAR_NETWORK=testnet              # testnet or mainnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_BASE_FEE=100                 # Base fee in stroops
STELLAR_TIMEOUT=30000                # Transaction timeout in ms
```

### 2. Import the Service

```typescript
import stellarService from './src/stellar';
```

## Usage Examples

### Generate Keypair

```typescript
import stellarService from './src/stellar';

// Generate new keypair
const keypair = stellarService.generateKeypair();
console.log('Public Key:', keypair.publicKey); // G...
console.log('Secret Key:', keypair.secretKey); // S...

// ⚠️ Remember to encrypt the secret key before storing!
```

### Create & Fund Testnet Account

```typescript
import stellarService from './src/stellar';

// Create and fund account on testnet
const result = await stellarService.createAndFundTestnetAccount();

if (result.funded) {
  console.log('Account created:', result.publicKey);
  console.log('Transaction:', result.transactionHash);
  // Store result.secretKey (encrypted!) for later use
} else {
  console.error('Funding failed:', result.error);
}
```

### Check Account Balance

```typescript
import stellarService from './src/stellar';

const publicKey = 'GDUQ...';

// Get XLM balance
const balance = await stellarService.getBalance(publicKey);
console.log(`Balance: ${balance?.balance} ${balance?.asset}`);

// Get account info
const accountInfo = await stellarService.getAccountInfo(publicKey);
console.log('Account ID:', accountInfo?.id);
console.log('Balances:', accountInfo?.balances);
```

### Send Payment

```typescript
import stellarService from './src/stellar';

const result = await stellarService.sendPayment({
  sourceSecret: 'SXYZ...', // Source account secret key
  destinationId: 'GDUQ...', // Destination public key
  amount: '10', // Amount in XLM
  memo: 'Payment for services', // Optional memo
});

if (result.success) {
  console.log('Payment sent!');
  console.log('Transaction hash:', result.hash);
  console.log('Ledger:', result.ledger);
} else {
  console.error('Payment failed:', result.error);
}
```

### Get Transaction History

```typescript
import stellarService from './src/stellar';

// Get last 10 transactions
const transactions = await stellarService.getTransactionHistory(publicKey, 10);

// Get last 10 payments
const payments = await stellarService.getPaymentHistory(publicKey, 10);

console.log('Recent transactions:', transactions);
console.log('Recent payments:', payments);
```

### Validate Keys

```typescript
import stellarService from './src/stellar';

// Validate public key
const isValidPublic = stellarService.isValidPublicKey('GDUQ...');

// Validate secret key
const isValidSecret = stellarService.isValidSecretKey('SXYZ...');
```

## API Reference

### `generateKeypair(): StellarKeypair`

Generates a new random Stellar keypair.

**Returns:**

```typescript
{
  publicKey: string; // G...
  secretKey: string; // S...
}
```

---

### `createAndFundTestnetAccount(): Promise<AccountCreationResult>`

Creates and funds a new account on testnet using Friendbot.

**Returns:**

```typescript
{
  publicKey: string;
  secretKey: string;
  funded: boolean;
  transactionHash?: string;
  error?: string;
}
```

---

### `getAccountInfo(publicKey: string): Promise<StellarAccountInfo | null>`

Gets detailed account information from the network.

**Parameters:**

- `publicKey` - Stellar public key (G...)

**Returns:**

```typescript
{
  id: string;
  accountId: string;
  sequence: string;
  balances: StellarBalance[];
  signers: StellarSigner[];
  subentryCount: number;
}
```

---

### `accountExists(publicKey: string): Promise<boolean>`

Checks if an account exists on the network.

**Parameters:**

- `publicKey` - Stellar public key

**Returns:** `true` if account exists, `false` otherwise

---

### `getBalance(publicKey: string, assetCode?: string): Promise<BalanceResult | null>`

Gets the balance for a specific asset.

**Parameters:**

- `publicKey` - Stellar public key
- `assetCode` - Asset code (default: 'native' for XLM)

**Returns:**

```typescript
{
  balance: string;
  asset: string;
  assetCode?: string;
  assetIssuer?: string;
}
```

---

### `sendPayment(params: PaymentParams): Promise<TransactionResult>`

Sends a payment transaction.

**Parameters:**

```typescript
{
  sourceSecret: string;      // Source account secret key
  destinationId: string;     // Destination public key
  amount: string;            // Amount to send
  assetCode?: string;        // Optional: custom asset code
  assetIssuer?: string;      // Optional: custom asset issuer
  memo?: string;             // Optional: transaction memo
}
```

**Returns:**

```typescript
{
  success: boolean;
  hash?: string;
  ledger?: number;
  error?: string;
}
```

---

### `getTransactionHistory(publicKey: string, limit?: number): Promise<unknown[]>`

Gets transaction history for an account.

**Parameters:**

- `publicKey` - Stellar public key
- `limit` - Number of records (default: 10)

**Returns:** Array of transaction records

---

### `getPaymentHistory(publicKey: string, limit?: number): Promise<unknown[]>`

Gets payment history for an account.

**Parameters:**

- `publicKey` - Stellar public key
- `limit` - Number of records (default: 10)

**Returns:** Array of payment records

---

### `isValidPublicKey(publicKey: string): boolean`

Validates a Stellar public key format.

---

### `isValidSecretKey(secretKey: string): boolean`

Validates a Stellar secret key format.

---

### `getNetworkInfo()`

Gets current network configuration.

**Returns:**

```typescript
{
  network: 'testnet' | 'mainnet';
  horizonUrl: string;
  networkPassphrase: string;
}
```

## Integration with Encryption Service

**IMPORTANT:** Always encrypt secret keys before storing!

```typescript
import stellarService from './src/stellar';
import encryptionService from './src/encryption';

// Create account
const account = await stellarService.createAndFundTestnetAccount();

if (account.funded) {
  // Encrypt secret key before storing
  const encryptedSecret = await encryptionService.encryptSecretKey(account.secretKey);

  // Save to database
  await Wallet.create({
    user_id: userId,
    account_blockchain_address: account.publicKey,
    account_private_key: encryptedSecret, // ✅ Encrypted!
  });
}

// Later, when you need to use the secret key
const wallet = await Wallet.findByPk(walletId);
const decryptedSecret = await encryptionService.decryptSecretKey(wallet.account_private_key);

// Use for payment
await stellarService.sendPayment({
  sourceSecret: decryptedSecret,
  destinationId: destinationPublicKey,
  amount: '10',
});
```

## Testing

Run the test suite:

```bash
npm test src/stellar/tests/stellar.service.test.ts
```

Tests include:

- Keypair generation
- Key validation
- Testnet account creation
- Balance queries
- Transaction history
- Payment operations

**Note:** Some tests require network access and may be rate-limited by Friendbot.

## Network Configuration

### Testnet (Default)

```bash
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

- Free test XLM via Friendbot
- Perfect for development
- Reset periodically

### Mainnet (Production)

```bash
STELLAR_NETWORK=mainnet
STELLAR_HORIZON_URL=https://horizon.stellar.org
```

- Real XLM required
- Production-ready
- Permanent ledger

## Error Handling

All methods handle errors gracefully:

```typescript
// Account not found
const accountInfo = await stellarService.getAccountInfo('GDUQ...');
// Returns null if account doesn't exist

// Payment failure
const result = await stellarService.sendPayment({...});
if (!result.success) {
  console.error('Error:', result.error);
  console.error('Details:', result.errorDetails);
}
```

## Security Best Practices

### ✅ DO:

- Encrypt secret keys before storage (use encryption service)
- Validate keys before use
- Use in services layer only
- Handle errors appropriately
- Log operations for audit

### ❌ DON'T:

- Store secret keys in plain text
- Expose secret keys via API
- Import in controllers or routes
- Hard-code secret keys
- Skip validation

## Common Patterns

### Create Wallet for User

```typescript
import stellarService from './src/stellar';
import encryptionService from './src/encryption';

async function createUserWallet(userId: number) {
  // Generate and fund account
  const account = await stellarService.createAndFundTestnetAccount();

  if (!account.funded) {
    throw new Error('Failed to fund account');
  }

  // Encrypt secret key
  const encryptedSecret = await encryptionService.encryptSecretKey(account.secretKey);

  // Save to database
  return await Wallet.create({
    user_id: userId,
    account_blockchain_address: account.publicKey,
    account_private_key: encryptedSecret,
    account_balance: 10000, // Initial friendbot funding
  });
}
```

### Process Payment

```typescript
async function processPayment(walletId: number, destinationAddress: string, amount: string) {
  // Get wallet
  const wallet = await Wallet.findByPk(walletId);

  // Decrypt secret key
  const secretKey = await encryptionService.decryptSecretKey(wallet.account_private_key);

  // Send payment
  const result = await stellarService.sendPayment({
    sourceSecret: secretKey,
    destinationId: destinationAddress,
    amount,
    memo: `Payment from user ${wallet.user_id}`,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  // Update balance
  await wallet.reload();
  const newBalance = await stellarService.getBalance(wallet.account_blockchain_address);
  await wallet.update({ account_balance: parseFloat(newBalance?.balance || '0') });

  return result;
}
```

## Troubleshooting

**"Account not found"**

- Account hasn't been funded yet
- Wrong network (testnet vs mainnet)
- Invalid public key

**"Failed to fund account via Friendbot"**

- Rate limited (wait a few seconds)
- Network connectivity issue
- Not on testnet

**"Transaction failed"**

- Insufficient balance
- Invalid destination
- Network fee too low

## References

- [Stellar Documentation](https://developers.stellar.org/)
- [Stellar SDK](https://github.com/stellar/js-stellar-sdk)
- [Horizon API](https://developers.stellar.org/api)
- [Testnet Friendbot](https://developers.stellar.org/docs/fundamentals-and-concepts/testnet-and-pubnet)

---

**Service is production-ready and follows best practices!** ✅

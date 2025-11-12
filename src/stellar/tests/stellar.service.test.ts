import stellarService from '../stellar.service';

/**
 * Stellar Service Tests
 * Run with: npm test src/stellar/tests/stellar.service.test.ts
 */
describe('StellarService', () => {
  describe('Keypair Generation', () => {
    it('should generate a valid keypair', () => {
      const keypair = stellarService.generateKeypair();

      expect(keypair).toBeDefined();
      expect(keypair.publicKey).toBeDefined();
      expect(keypair.secretKey).toBeDefined();
      expect(keypair.publicKey).toMatch(/^G[A-Z0-9]{55}$/);
      expect(keypair.secretKey).toMatch(/^S[A-Z0-9]{55}$/);
    });

    it('should generate different keypairs', () => {
      const keypair1 = stellarService.generateKeypair();
      const keypair2 = stellarService.generateKeypair();

      expect(keypair1.publicKey).not.toBe(keypair2.publicKey);
      expect(keypair1.secretKey).not.toBe(keypair2.secretKey);
    });
  });

  describe('Key Validation', () => {
    it('should validate correct public key', () => {
      const keypair = stellarService.generateKeypair();
      expect(stellarService.isValidPublicKey(keypair.publicKey)).toBe(true);
    });

    it('should reject invalid public key', () => {
      expect(stellarService.isValidPublicKey('invalid-key')).toBe(false);
      expect(stellarService.isValidPublicKey('')).toBe(false);
      expect(stellarService.isValidPublicKey('GABC123')).toBe(false);
    });

    it('should validate correct secret key', () => {
      const keypair = stellarService.generateKeypair();
      expect(stellarService.isValidSecretKey(keypair.secretKey)).toBe(true);
    });

    it('should reject invalid secret key', () => {
      expect(stellarService.isValidSecretKey('invalid-key')).toBe(false);
      expect(stellarService.isValidSecretKey('')).toBe(false);
      expect(stellarService.isValidSecretKey('SABC123')).toBe(false);
    });
  });

  describe('Network Information', () => {
    it('should return network configuration', () => {
      const networkInfo = stellarService.getNetworkInfo();

      expect(networkInfo).toBeDefined();
      expect(networkInfo.network).toBeDefined();
      expect(networkInfo.horizonUrl).toBeDefined();
      expect(networkInfo.networkPassphrase).toBeDefined();
      expect(['testnet', 'mainnet']).toContain(networkInfo.network);
    });
  });

  describe('Testnet Operations', () => {
    it('should create and fund testnet account', async () => {
      const result = await stellarService.createAndFundTestnetAccount();

      expect(result).toBeDefined();
      expect(result.publicKey).toBeDefined();
      expect(result.secretKey).toBeDefined();

      // Check if funded successfully (may fail if rate limited)
      if (result.funded) {
        expect(result.transactionHash).toBeDefined();
        expect(stellarService.isValidPublicKey(result.publicKey)).toBe(true);
        expect(stellarService.isValidSecretKey(result.secretKey)).toBe(true);
      }
    }, 30000); // 30 second timeout for network request

    it('should get account info for funded account', async () => {
      // First create and fund an account
      const createResult = await stellarService.createAndFundTestnetAccount();

      if (!createResult.funded) {
        console.log('Skipping test: Account funding failed (possible rate limit)');
        return;
      }

      // Wait a bit for account to be available
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get account info
      const accountInfo = await stellarService.getAccountInfo(createResult.publicKey);

      expect(accountInfo).toBeDefined();
      expect(accountInfo?.id).toBe(createResult.publicKey);
      expect(accountInfo?.balances).toBeDefined();
      expect(accountInfo?.balances.length).toBeGreaterThan(0);
    }, 40000);

    it('should return null for non-existent account', async () => {
      const randomKeypair = stellarService.generateKeypair();
      const accountInfo = await stellarService.getAccountInfo(randomKeypair.publicKey);

      expect(accountInfo).toBeNull();
    });

    it('should check if account exists', async () => {
      const randomKeypair = stellarService.generateKeypair();
      const exists = await stellarService.accountExists(randomKeypair.publicKey);

      expect(exists).toBe(false);
    });

    it('should get balance for funded account', async () => {
      const createResult = await stellarService.createAndFundTestnetAccount();

      if (!createResult.funded) {
        console.log('Skipping test: Account funding failed');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const balance = await stellarService.getBalance(createResult.publicKey);

      expect(balance).toBeDefined();
      expect(balance?.balance).toBeDefined();
      expect(balance?.asset).toBe('XLM');
      expect(parseFloat(balance?.balance || '0')).toBeGreaterThan(0);
    }, 40000);
  });

  describe('Payment Operations', () => {
    it('should reject payment with invalid destination', async () => {
      const keypair = stellarService.generateKeypair();

      const result = await stellarService.sendPayment({
        sourceSecret: keypair.secretKey,
        destinationId: 'invalid-address',
        amount: '10',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject payment with zero amount', async () => {
      const sourceKeypair = stellarService.generateKeypair();
      const destKeypair = stellarService.generateKeypair();

      const result = await stellarService.sendPayment({
        sourceSecret: sourceKeypair.secretKey,
        destinationId: destKeypair.publicKey,
        amount: '0',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('greater than zero');
    });
  });

  describe('History Operations', () => {
    it('should get transaction history for account', async () => {
      const createResult = await stellarService.createAndFundTestnetAccount();

      if (!createResult.funded) {
        console.log('Skipping test: Account funding failed');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const history = await stellarService.getTransactionHistory(createResult.publicKey, 5);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    }, 40000);

    it('should get payment history for account', async () => {
      const createResult = await stellarService.createAndFundTestnetAccount();

      if (!createResult.funded) {
        console.log('Skipping test: Account funding failed');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const history = await stellarService.getPaymentHistory(createResult.publicKey, 5);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    }, 40000);
  });
});

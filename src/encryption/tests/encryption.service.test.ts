import encryptionService from '../encryption.service';

/**
 * Encryption Service Tests
 * Run with: npm test
 */
describe('EncryptionService', () => {
  // Set environment variable for testing
  beforeAll(() => {
    if (!process.env.MASTER_ENCRYPTION_KEY) {
      // Generate a test key
      const testKey = require('crypto').randomBytes(32).toString('base64');
      process.env.MASTER_ENCRYPTION_KEY = testKey;
    }
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const plainText = 'my-secret-private-key';

      const encrypted = await encryptionService.encryptSecretKey(plainText);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);

      const decrypted = await encryptionService.decryptSecretKey(encrypted);
      expect(decrypted).toBe(plainText);
    });

    it('should produce different encrypted outputs for same input', async () => {
      const plainText = 'test-data';

      const encrypted1 = await encryptionService.encryptSecretKey(plainText);
      const encrypted2 = await encryptionService.encryptSecretKey(plainText);

      // Should be different due to random salt and IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same value
      const decrypted1 = await encryptionService.decryptSecretKey(encrypted1);
      const decrypted2 = await encryptionService.decryptSecretKey(encrypted2);
      expect(decrypted1).toBe(plainText);
      expect(decrypted2).toBe(plainText);
    });

    it('should handle long text', async () => {
      const longText = 'a'.repeat(1000);

      const encrypted = await encryptionService.encryptSecretKey(longText);
      const decrypted = await encryptionService.decryptSecretKey(encrypted);

      expect(decrypted).toBe(longText);
    });

    it('should handle special characters', async () => {
      const specialText = '!@#$%^&*()_+-={}[]|:";\'<>?,./~`';

      const encrypted = await encryptionService.encryptSecretKey(specialText);
      const decrypted = await encryptionService.decryptSecretKey(encrypted);

      expect(decrypted).toBe(specialText);
    });

    it('should throw error for empty text encryption', async () => {
      await expect(encryptionService.encryptSecretKey('')).rejects.toThrow();
    });

    it('should throw error for invalid encrypted text', async () => {
      await expect(encryptionService.decryptSecretKey('invalid-data')).rejects.toThrow();
    });
  });

  describe('Hashing', () => {
    it('should hash text correctly', () => {
      const text = 'password123';
      const hashed = encryptionService.hash(text);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(text);
      expect(hashed.length).toBe(64); // SHA-256 hex output
    });

    it('should produce same hash for same input', () => {
      const text = 'test-data';
      const hash1 = encryptionService.hash(text);
      const hash2 = encryptionService.hash(text);

      expect(hash1).toBe(hash2);
    });

    it('should compare hash correctly', () => {
      const plainText = 'myPassword123';
      const hashed = encryptionService.hash(plainText);

      expect(encryptionService.compareHash(plainText, hashed)).toBe(true);
      expect(encryptionService.compareHash('wrongPassword', hashed)).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('should generate secure token', () => {
      const token = encryptionService.generateSecureToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens', () => {
      const token1 = encryptionService.generateSecureToken();
      const token2 = encryptionService.generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate token with custom length', () => {
      const token = encryptionService.generateSecureToken(16);

      expect(token).toBeDefined();
      // Base64url encoded length will be longer than raw bytes
      expect(token.length).toBeGreaterThan(16);
    });
  });

  describe('Master Key Generation', () => {
    it('should generate a valid master key', () => {
      const masterKey = require('../encryption.service').default.constructor.generateMasterKey();

      expect(masterKey).toBeDefined();
      expect(typeof masterKey).toBe('string');

      // Should be base64 encoded (length ~44 for 32 bytes)
      expect(masterKey.length).toBeGreaterThan(40);
    });

    it('should generate different master keys', () => {
      const key1 = require('../encryption.service').default.constructor.generateMasterKey();
      const key2 = require('../encryption.service').default.constructor.generateMasterKey();

      expect(key1).not.toBe(key2);
    });
  });
});

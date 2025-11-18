import * as crypto from 'crypto';

import logger from '../utils/logger.utils';

/**
 * Encryption Service
 * Uses AES-256-GCM with PBKDF2 key derivation for secure encryption
 * Based on production implementation from api.fastbuka.com
 *
 * ⚠️ SECURITY WARNING:
 * - This service is PRIVATE and for INTERNAL USE ONLY
 * - NEVER expose encryption/decryption methods via API endpoints
 * - NEVER return encrypted/decrypted data directly to clients
 * - Only use within backend services (wallet, transaction, etc.)
 * - Do NOT create routes that call these methods directly
 *
 * @internal - For internal codebase use only
 */
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 12;
  private readonly saltLength = 16;
  private readonly tagLength = 16;
  private masterKey: Buffer | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the encryption service with master key
   */
  private initialize(): void {
    if (!process.env.MASTER_ENCRYPTION_KEY) {
      logger.error('MASTER_ENCRYPTION_KEY is not defined in environment variables');
      const generatedKey = crypto.randomBytes(32).toString('base64');
      console.log('Generated new MASTER_ENCRYPTION_KEY:', generatedKey);
      process.env.MASTER_ENCRYPTION_KEY = generatedKey;
      throw new Error('MASTER_ENCRYPTION_KEY must be set in environment variables');
    }

    try {
      this.masterKey = Buffer.from(process.env.MASTER_ENCRYPTION_KEY, 'base64');
      logger.info('Encryption service initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize encryption service: ${error}`);
      throw new Error('Failed to initialize encryption service');
    }
  }

  /**
   * Encrypt a secret key or sensitive data
   * @param text - Plain text to encrypt
   * @returns Base64 encoded encrypted string containing salt, iv, authTag, and encrypted data
   */
  async encryptSecretKey(text: string): Promise<string> {
    try {
      if (!text) {
        throw new Error('Text to encrypt cannot be empty');
      }

      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);

      const key = await this.deriveKey(salt);
      const cipher = crypto.createCipheriv(this.algorithm, key as crypto.CipherKey, iv as crypto.BinaryLike, {
        authTagLength: this.tagLength,
      });

      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      // Combine all parts into a single buffer
      const combined = Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'base64')] as Uint8Array[]);

      return combined.toString('base64');
    } catch (error) {
      logger.error(`Encryption failed: ${error}`);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted secret key
   * @param encryptedText - Base64 encoded encrypted string
   * @returns Decrypted plain text
   */
  async decryptSecretKey(encryptedText: string): Promise<string> {
    try {
      if (!encryptedText) {
        throw new Error('Text to decrypt cannot be empty');
      }

      const combined = Buffer.from(encryptedText, 'base64');

      // Extract all parts from combined buffer
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(this.saltLength, this.saltLength + this.ivLength);
      const authTag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = combined.subarray(this.saltLength + this.ivLength + this.tagLength);

      const key = await this.deriveKey(salt);
      const decipher = crypto.createDecipheriv(this.algorithm, key as crypto.CipherKey, iv as crypto.BinaryLike, {
        authTagLength: this.tagLength,
      });

      decipher.setAuthTag(authTag as NodeJS.ArrayBufferView);

      const decryptedBuffer = decipher.update(encrypted as NodeJS.ArrayBufferView);
      const finalBuffer = decipher.final();
      const decrypted = Buffer.concat([decryptedBuffer, finalBuffer] as Uint8Array[]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error(`Decryption failed: ${error}`);
      throw new Error('Failed to decrypt secret key');
    }
  }

  /**
   * Derive a key from master key and salt using PBKDF2
   * @param salt - Salt buffer
   * @returns Derived key buffer
   */
  private async deriveKey(salt: Buffer): Promise<Buffer> {
    if (!process.env.MASTER_ENCRYPTION_KEY) {
      throw new Error('MASTER_ENCRYPTION_KEY is not defined');
    }

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        process.env.MASTER_ENCRYPTION_KEY as string,
        salt as crypto.BinaryLike,
        100000, // iterations (high for security)
        32, // key length
        'sha256',
        (err, derivedKey) => {
          if (err) {
            logger.error(`Key derivation failed: ${err}`);
            reject(err);
          } else {
            resolve(derivedKey);
          }
        }
      );
    });
  }

  /**
   * Generate a secure master encryption key
   * This should be run once and stored securely
   * @returns Base64 encoded master key
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Hash data using SHA-256 (for passwords, one-way hashing)
   * @param text - Text to hash
   * @returns Hex-encoded hash
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Compare plain text with hashed value (timing-safe)
   * @param plainText - Plain text to compare
   * @param hashedText - Hashed text to compare against
   * @returns True if they match
   */
  compareHash(plainText: string, hashedText: string): boolean {
    const hashedInput = this.hash(plainText);
    return crypto.timingSafeEqual(
      Buffer.from(hashedInput) as NodeJS.ArrayBufferView,
      Buffer.from(hashedText) as NodeJS.ArrayBufferView
    );
  }

  /**
   * Generate a secure random token
   * @param length - Length in bytes (default: 32)
   * @returns URL-safe base64 token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
}

// Export singleton instance
export default new EncryptionService();

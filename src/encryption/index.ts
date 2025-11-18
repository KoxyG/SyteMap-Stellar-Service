/**
 * Encryption Module
 *
 * ⚠️ SECURITY WARNING - PRIVATE SERVICE
 * ========================================
 * This service is STRICTLY for INTERNAL backend use only.
 *
 * ✅ ALLOWED:
 * - Import in services layer (src/services/)
 * - Use for database encryption/decryption
 * - Internal business logic operations
 *
 * ❌ FORBIDDEN:
 * - Import in controllers (src/controllers/)
 * - Import in routes (src/routes/)
 * - Expose via API endpoints
 * - Return decrypted data to clients
 *
 * @module encryption
 * @internal
 * @security CRITICAL
 */

import EncryptionService from './encryption.service';

export default EncryptionService;
export { EncryptionService };

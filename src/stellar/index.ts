/**
 * Stellar Service Module
 *
 * ⚠️ INTERNAL SERVICE WARNING
 * ========================================
 * This service is for INTERNAL backend use only.
 *
 * ✅ ALLOWED:
 * - Import in services layer (src/services/)
 * - Use for blockchain operations
 * - Internal business logic
 *
 * ❌ FORBIDDEN:
 * - Import in controllers (src/controllers/)
 * - Import in routes (src/routes/)
 * - Expose private keys via API
 * - Return secret keys to clients
 *
 * @module stellar
 * @internal
 */

import StellarService from './stellar.service';

export default StellarService;
export { StellarService };

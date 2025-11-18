import { Asset, Keypair, Horizon, BASE_FEE, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import encryptionService from '../encryption/encryption.service';

import { HttpException } from '../exceptions/http.exception';

import logger from '../utils/logger.utils';

/**
 * Stellar Service
 * Handles all Stellar blockchain operations
 *
 * ⚠️ INTERNAL SERVICE:
 * - This service is for INTERNAL backend use only
 * - Use in services layer, not controllers or routes
 * - Private keys should be encrypted before storage
 * - Never expose private keys via API
 *
 * @internal - For internal codebase use only
 */
class StellarService {
  // private server: StellarSDK.Horizon.Server;
  // private networkPassphrase: string;
  private params = {
    fee: BASE_FEE,
    networkPassphrase: process.env.NODE_ENV === 'production' ? Networks.PUBLIC : Networks.TESTNET,
  };
  private readonly encryptionService = encryptionService;

  /**
   * Generate a random wallet, create the account on Stellar network,
   * and automatically add a trustline for the new wallet.
   * @returns Object with publicKey, encrypted secret, transaction info, and trustline status
   * @throws Error if wallet generation, account creation, or trustline setup fails
   */
  async generateAndCreateAccount(): Promise<{
    publicKey: string;
    encryptedSecret: string;
    transactionHash: string;
    trustlineAdded: boolean;
  }> {
    const logContext = '[StellarService.generateAndCreateAccount]';
    // Step 1: Generate random keypair
    const keypair = Keypair.random();
    const secretKey = keypair.secret();
    const publicKey = keypair.publicKey();
    let transactionHash = '';
    let trustlineAdded = false;
    logger.debug(`${logContext} Generated keypair for public key ${publicKey}`);

    try {
      logger.debug(`${logContext} Starting account creation workflow`);

      // Step 3: Validate environment variables
      if (!process.env.STELLAR_HORIZON_URL) {
        logger.error(`${logContext} Missing STELLAR_HORIZON_URL`);
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'STELLAR_HORIZON_URL not configured',
          },
          500
        );
      }

      const sponsorPubKey = process.env.SPONSOR_PUBLIC_KEY;
      if (!sponsorPubKey) {
        logger.error(`${logContext} Missing SPONSOR_PUBLIC_KEY`);
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'SPONSOR_PUBLIC_KEY not configured',
          },
          500
        );
      }

      if (!process.env.SPONSOR_PRIVATE_KEY) {
        logger.error(`${logContext} Missing SPONSOR_PRIVATE_KEY`);
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'SPONSOR_PRIVATE_KEY not configured',
          },
          500
        );
      }

      // Step 4: Create account on Stellar network
      const server = new Horizon.Server(process.env.STELLAR_HORIZON_URL);
      const sourceAccount = await server.loadAccount(sponsorPubKey);
      const sponsorKeypair = Keypair.fromSecret(process.env.SPONSOR_PRIVATE_KEY);

      // Build sponsored transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: this.params.fee,
        networkPassphrase: this.params.networkPassphrase,
      })
        .addOperation(
          Operation.beginSponsoringFutureReserves({
            sponsoredId: publicKey,
          })
        )
        .addOperation(
          Operation.createAccount({
            destination: publicKey,
            startingBalance: '0',
          })
        )
        .addOperation(
          Operation.endSponsoringFutureReserves({
            source: publicKey,
          })
        )
        .setTimeout(180)
        .build();
      logger.debug(`${logContext} Built sponsorship transaction for ${publicKey}`);

      // Sign with both sponsor and new account
      transaction.sign(sponsorKeypair);
      transaction.sign(keypair);
      logger.debug(`${logContext} Transaction signed by sponsor and new account`);

      // Submit transaction
      const result = await server.submitTransaction(transaction);
      transactionHash = result.hash;
      logger.info(`Account created successfully: ${publicKey}, tx: ${transactionHash}`);
    } catch (error) {
      logger.error(
        `${logContext} Failed to generate and create account: ${error instanceof Error ? error.message : error}`
      );

      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('op_underfunded')) {
          throw new HttpException(
            {
              status: 400,
              success: false,
              message: 'Sponsor account has insufficient funds',
            },
            400
          );
        } else if (error.message.includes('tx_bad_seq')) {
          throw new HttpException(
            {
              status: 503,
              success: false,
              message: 'Service temporarily unavailable, please try again',
            },
            503
          );
        } else if (error.message.includes('op_already_exists')) {
          throw new HttpException(
            {
              status: 409,
              success: false,
              message: 'Account already exists',
            },
            409
          );
        }
      }

      throw new HttpException(
        {
          status: 500,
          success: false,
          message: 'Failed to generate and create account',
        },
        500
      );
    }
    try {
      logger.debug(`${logContext} Initiating trustline setup for ${publicKey}`);
      await this.addTrustline(publicKey, secretKey);
      trustlineAdded = true;
    } catch (error) {
      logger.error(
        `${logContext} Failed to add trustline for ${publicKey}: ${error instanceof Error ? error.message : error}`
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 500,
          success: false,
          message: 'Failed to add trustline after account creation',
        },
        500
      );
    }

    const encryptedSecret = await this.encryptionService.encryptSecretKey(secretKey);
    logger.debug(`${logContext} Secret key encrypted for ${publicKey}`);

    return {
      publicKey,
      encryptedSecret,
      transactionHash,
      trustlineAdded,
    };
  }

  /**
   * Get and decrypted secret key for a user
   * @param userUuid - The UUID of the user
   * @returns Decrypted secret key
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getSecretKey(userUuid: string): Promise<string> {
    // TODO: Implement database query to get encrypted secret key for userUuid
    // ASK FOR AN ENDPOINT THAT CAN RETURN THE SECRET KEY FOR A USER IN THE DATABASE.

    try {
      // TODO: Replace with actual database query
      // const user = await this.databaseService.stellar.findUnique({
      //   where: { owner_uuid: userUuid },
      //   select: { secret_key: true },
      // });

      // Temporary placeholder - replace with actual database implementation
      throw new HttpException(
        {
          status: 501,
          success: false,
          message: 'Database integration not implemented yet',
        },
        501
      );

      // TODO: Uncomment when database is ready
      // if (!user || !user.secret_key) {
      //   throw new HttpException(
      //     {
      //       status: 404,
      //       success: false,
      //       message: 'Secret key not found for user',
      //     },
      //     404,
      //   );
      // }

      // const decryptedSecret = await this.encryptionService.decryptSecretKey(
      //   user.secret_key,
      // );
      // return decryptedSecret;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 500,
          success: false,
          message: 'Failed to retrieve secret key',
        },
        500
      );
    }
  }

  /**
   * Add trustline for SYTE currency using provided keys.
   * @param publicKey - Account public key
   * @param decryptedSecret - Plain secret key (will not be stored)
   */
  private async addTrustline(publicKey: string, decryptedSecret: string): Promise<void> {
    const logContext = '[StellarService.addTrustline]';
    if (!publicKey || !decryptedSecret) {
      logger.error(
        `${logContext} Missing credentials | publicKeyPresent=${Boolean(publicKey)} secretPresent=${Boolean(decryptedSecret)}`
      );
      throw new HttpException(
        {
          status: 400,
          success: false,
          message: 'Public key and secret key are required',
        },
        400
      );
    }

    try {
      logger.debug(`${logContext} Starting trustline workflow for ${publicKey}`);
      if (!process.env.SPONSOR_PRIVATE_KEY) {
        logger.error(`${logContext} Missing SPONSOR_PRIVATE_KEY`);
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'SPONSOR_PRIVATE_KEY not configured',
          },
          500
        );
      }

      if (!process.env.STELLAR_HORIZON_URL) {
        logger.error(`${logContext} Missing STELLAR_HORIZON_URL`);
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'STELLAR_HORIZON_URL not configured',
          },
          500
        );
      }

      if (!process.env.SYTE_ASSET_CODE) {
        logger.error(`${logContext} Missing SYTE_ASSET_CODE`);
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'SYTE_ASSET_CODE not configured',
          },
          500
        );
      }

      if (!process.env.SYTE_ISSUER_ADDRESS) {
        logger.error(`${logContext} Missing SYTE_ISSUER_ADDRESS`);
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'SYTE_ASSET_ISSUER not configured',
          },
          500
        );
      }

      const sponsorPubKey = process.env.SPONSOR_PUBLIC_KEY;
      if (!sponsorPubKey) {
        logger.error(`${logContext} Missing SPONSOR_PUBLIC_KEY`);
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'SPONSOR_PUBLIC_KEY not configured',
          },
          500
        );
      }

      const sponsorKeypair = Keypair.fromSecret(process.env.SPONSOR_PRIVATE_KEY);
      const server = new Horizon.Server(process.env.STELLAR_HORIZON_URL);
      const paymentAsset = new Asset(process.env.SYTE_ASSET_CODE, process.env.SYTE_ISSUER_ADDRESS);
      const sourceAccount = await server.loadAccount(sponsorPubKey);
      logger.debug(`${logContext} Loaded sponsor account ${sponsorPubKey}`);
      const userKeypair = Keypair.fromSecret(decryptedSecret);
      logger.debug(`${logContext} Prepared trustline transaction context for ${publicKey}`);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.params.networkPassphrase,
      })
        .addOperation(
          Operation.beginSponsoringFutureReserves({
            sponsoredId: publicKey,
          })
        )
        .addOperation(
          Operation.changeTrust({
            source: publicKey,
            asset: paymentAsset,
            limit: '10000000',
          })
        )
        .addOperation(
          Operation.endSponsoringFutureReserves({
            source: publicKey,
          })
        )
        .setTimeout(180)
        .build();

      transaction.sign(sponsorKeypair);
      transaction.sign(userKeypair);
      logger.debug(`${logContext} Signed trustline transaction for ${publicKey}`);

      await server.submitTransaction(transaction);
      logger.info(`Trustline added successfully for account: ${publicKey}`);
    } catch (error) {
      logger.error(
        `${logContext} Failed to add trustline for ${publicKey}: ${error instanceof Error ? error.message : error}`
      );

      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('op_underfunded')) {
          throw new HttpException(
            {
              status: 400,
              success: false,
              message: 'Sponsor account has insufficient funds',
            },
            400
          );
        } else if (error.message.includes('tx_bad_seq')) {
          throw new HttpException(
            {
              status: 503,
              success: false,
              message: 'Service temporarily unavailable, please try again',
            },
            503
          );
        } else if (error.message.includes('op_no_trust')) {
          throw new HttpException(
            {
              status: 400,
              success: false,
              message: 'Trustline operation failed',
            },
            400
          );
        }
      }

      throw new HttpException(
        {
          status: 500,
          success: false,
          message: 'Failed to add trustline',
        },
        500
      );
    }
  }
}

// Export singleton instance
export default new StellarService();

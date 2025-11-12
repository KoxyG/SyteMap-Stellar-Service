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
   * Generate a random wallet and create the account on Stellar network
   * @returns Object with publicKey, encrypted secret, and transaction result
   * @throws Error if wallet generation or account creation fails
   */
  async generateAndCreateAccount(): Promise<{
    publicKey: string;
    encryptedSecret: string;
    transactionHash: string;
  }> {
    try {
      // Step 1: Generate random keypair
      const keypair = Keypair.random();
      const secretKey = keypair.secret();
      const publicKey = keypair.publicKey();

      // Step 3: Validate environment variables
      if (!process.env.STELLAR_HORIZON_URL) {
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

      // Sign with both sponsor and new account
      transaction.sign(sponsorKeypair);
      transaction.sign(keypair);

      // Submit transaction
      const result = await server.submitTransaction(transaction);
      logger.info(`Account created successfully: ${publicKey}, tx: ${result.hash}`);
      // Final step: Encrypt the secret key
      const encryptedSecret = await this.encryptionService.encryptSecretKey(secretKey);

      return {
        publicKey,
        encryptedSecret,
        transactionHash: result.hash,
      };
    } catch (error) {
      logger.error(`Failed to generate and create account: ${error}`);

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
  }

  /**
   * Get and decrypted secret key for a user
   * @param userUuid - The UUID of the user
   * @returns Decrypted secret key
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSecretKey(userUuid: string): Promise<string> {
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
   * Add trustline for SYTE currency to a user's Stellar account.
   * @param userUuid - The UUID of the user.
   */
  async addTrustline(userUuid: string) {
    const user = ''; // TODO: Get user information from database

    if (!user) {
      throw new HttpException(
        {
          status: 404,
          success: false,
          message: 'User not found',
        },
        404
      );
    }

    try {
      const public_key = ''; // TODO: Get user public key from database
      // console.log('User public key:', public_key);

      const usersecretKey = await this.getSecretKey(userUuid); // TODO: use user_uuid to decrypt the secret key.

      const userKeypair = Keypair.fromSecret(usersecretKey);
      // console.log('User keypair created successfully');

      // Validate environment variables
      if (!process.env.SPONSOR_PRIVATE_KEY) {
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
        throw new HttpException(
          {
            status: 500,
            success: false,
            message: 'SYTE_ASSET_CODE not configured',
          },
          500
        );
      }

      if (!process.env.SYTE_ASSET_ISSUER) {
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

      // Create Asset object for SYTE token
      const paymentAsset = new Asset(process.env.SYTE_ASSET_CODE, process.env.SYTE_ASSET_ISSUER);

      // console.log('Loading source account...');
      const sourceAccount = await server.loadAccount(sponsorPubKey);
      // Build transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.params.networkPassphrase,
      })
        .addOperation(
          Operation.beginSponsoringFutureReserves({
            sponsoredId: public_key,
          })
        )
        .addOperation(
          Operation.changeTrust({
            source: public_key,
            asset: paymentAsset,
            limit: '10000000',
          })
        )
        .addOperation(
          Operation.endSponsoringFutureReserves({
            source: public_key,
          })
        )
        .setTimeout(180)
        .build();

      transaction.sign(sponsorKeypair);
      transaction.sign(userKeypair);
      // Submit the transaction
      await server.submitTransaction(transaction);

      logger.info(`Trustline added successfully for user: ${userUuid}`);
    } catch (error) {
      logger.error(`Failed to add trustline: ${error}`);

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

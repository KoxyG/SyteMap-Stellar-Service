import { Request, Response, NextFunction } from 'express';

import stellarService from '../stellar/stellar.service';

class StellarController {
  /**
   * POST
   * Generates a mnemonic phrase, derives a keypair from it, creates a new Stellar account,
   * and returns account details including the mnemonic.
   */
  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await stellarService.generateAndCreateAccount();
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StellarController();

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
      const accountIndex = req.body.accountIndex !== undefined ? Number(req.body.accountIndex) : 0;
      
      if (isNaN(accountIndex) || accountIndex < 0) {
        res.status(400).json({
          success: false,
          message: 'accountIndex must be a non-negative number',
        });
        return;
      }

      const result = await stellarService.generateAndCreateAccount(accountIndex);
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

import { Request, Response, NextFunction } from 'express';

import stellarService from '../stellar/stellar.service';

class StellarController {
  /**
   * POST 
   * Creates a new Stellar account and returns account details.
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

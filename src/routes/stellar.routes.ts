import { Router } from 'express';

import StellarController from '../controllers/stellar.controller';

const router = Router();

router.post('/create_stellar_account', (req, res, next) => {
  // #swagger.tags = ['Stellar']
  // #swagger.operationId = 'create_stellar_account'
  // #swagger.description = 'Generate a mnemonic phrase, derive a keypair from it, create a new Stellar account, and return account details including the mnemonic'
  // #swagger.parameters['body'] = {
  //   in: 'body',
  //   description: 'Optional account index for HD wallet derivation',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       accountIndex: {
  //         type: 'number',
  //         description: 'Account index for HD wallet derivation (default: 0)',
  //         example: 0
  //       }
  //     }
  //   }
  // }
  StellarController.createAccount(req, res, next);
});

export default router;

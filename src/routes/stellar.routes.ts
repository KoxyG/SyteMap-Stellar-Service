import { Router } from 'express';

import StellarController from '../controllers/stellar.controller';

const router = Router();

router.post('/create_stellar_account', (req, res, next) => {
  // #swagger.tags = ['Stellar']
  // #swagger.operationId = 'create_stellar_account'
  StellarController.createAccount(req, res, next);
});

export default router;

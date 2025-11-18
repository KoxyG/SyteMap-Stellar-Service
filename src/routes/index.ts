import { Router } from 'express';
import stellarRoutes from './stellar.routes';
import defaultRoutes from './default.routes';

const v1Router = Router();

// Mount default routes (welcome, benchmark, etc.)
v1Router.use('', defaultRoutes);
// Mount stellar routes
v1Router.use('', stellarRoutes);

export default v1Router;

import { Router } from 'express';
import stellarRoutes from './stellar.routes';

const v1Router = Router();


v1Router.use('', stellarRoutes);

export default v1Router;

import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// middlewares
import globalErrorHandler from './middleware/globleErrorHandler.middleware';
// routes
import v1Router from './routes';
import CustomError from './utils/customError.utils';

export default (): Application => {
  const app: Application = express();

  // Rate limiting configuration to prevent DDoS attacks
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiter to all routes
  app.use(limiter);

  // Body parser with size limits to prevent large payloads
  const bodyLimit = process.env.BODY_PARSER_LIMIT || '10mb';
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Add security headers
  app.use(helmet());
  // Disable fingerprinting
  app.disable('x-powered-by');
  // set public folder for static files
  app.use(express.static(__dirname?.replace('src', '') + 'public'));

  // v1 routes
  app.use('/api/v1', v1Router);

  // path not found
  app.use((req: Request, res: Response, next: NextFunction) => {
    const error = new CustomError('Resource not found', 404);
    next(error);
  });

  // global error handler
  app.use(globalErrorHandler);

  return app;
};

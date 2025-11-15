import express, { Application, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// middlewares
import globalErrorHandler from './middleware/globleErrorHandler.middleware';
// routes
import v1Router from './routes';
import CustomError from './utils/customError.utils';
import logger from './utils/logger.utils';

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

  // swagger ui configuration
  try {
    const swaggerDocumentPath = path.resolve(__dirname, 'swagger', 'documentation.swagger.json');
    if (fs.existsSync(swaggerDocumentPath)) {
      const swaggerDocument = JSON.parse(fs.readFileSync(swaggerDocumentPath, { encoding: 'utf-8' }));
      const swaggerUiHandler = swaggerUi.setup(swaggerDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
        },
        customSiteTitle: 'API Documentation',
      });

      // Serve Swagger UI at /docs - handle all sub-paths for client-side routing
      app.use('/docs', swaggerUi.serve);
      app.get('/docs', swaggerUiHandler);
      app.get('/docs/*', swaggerUiHandler);
    } else {
      app.get('/docs', (_req, res) =>
        res.status(503).json({
          status: 'error',
          message: 'Swagger documentation is not available yet. Please try again shortly.',
        }),
      );
    }
  } catch (error) {
    logger.error(`Failed to load Swagger UI documentation: ${error}`);
    app.get('/docs', (_req, res) =>
      res.status(500).json({
        status: 'error',
        message: 'Unable to load Swagger documentation at the moment.',
      }),
    );
  }

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

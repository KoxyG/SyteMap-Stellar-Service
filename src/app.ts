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
  // set public folder for static files (works in both dev and production)
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

  // swagger ui configuration
  try {
    // Handle both dev (src/swagger) and production (dist/swagger) paths
    const swaggerDocPath = __dirname.includes('dist')
      ? path.join(__dirname, 'swagger', 'documentation.swagger.json')
      : path.join(__dirname, 'swagger', 'documentation.swagger.json');
    // Fallback to source location if not found in dist
    const swaggerDocumentPath = fs.existsSync(swaggerDocPath)
      ? swaggerDocPath
      : path.join(process.cwd(), 'src', 'swagger', 'documentation.swagger.json');
    if (fs.existsSync(swaggerDocumentPath)) {
      const swaggerDocument = JSON.parse(fs.readFileSync(swaggerDocumentPath, { encoding: 'utf-8' }));
      
      // Dynamically update server URL based on current environment
      // This ensures the Swagger UI always shows the correct production URL
      const getServerUrl = (req: Request): string => {
        // Get the protocol and host from the request
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
        const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:8000';
        
        // Check environment variables first (most reliable)
        if (process.env.RENDER_EXTERNAL_URL) {
          return process.env.RENDER_EXTERNAL_URL;
        }
        if (process.env.VERCEL_URL) {
          return `https://${process.env.VERCEL_URL}`;
        }
        
        // Use request-based URL (works in production with proxy headers)
        return `${protocol}://${host}`;
      };
      
      // Create a dynamic handler that updates the server URL based on the request
      const swaggerUiHandler = (req: Request, res: Response, next: NextFunction) => {
        const serverUrl = getServerUrl(req);
        const dynamicSwaggerDoc = {
          ...swaggerDocument,
          servers: [
            {
              url: `${serverUrl}/api/v1`,
              description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
            },
          ],
        };
        
        const handler = swaggerUi.setup(dynamicSwaggerDoc, {
          customCss: '.swagger-ui .topbar { display: none }',
          swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            tryItOutEnabled: true,
          },
          customSiteTitle: 'API Documentation',
        });
        
        // swaggerUi.setup returns a middleware function
        return handler(req, res, next);
      };

      // Serve Swagger UI at /docs - handle all sub-paths for client-side routing
      app.use('/docs', swaggerUi.serve);
      app.get('/docs', swaggerUiHandler);
      app.get('/docs/*', swaggerUiHandler);
    } else {
      app.get('/docs', (_req, res) =>
        res.status(503).json({
          status: 'error',
          message: 'Swagger documentation is not available yet. Please try again shortly.',
        })
      );
    }
  } catch (error) {
    logger.error(`Failed to load Swagger UI documentation: ${error}`);
    app.get('/docs', (_req, res) =>
      res.status(500).json({
        status: 'error',
        message: 'Unable to load Swagger documentation at the moment.',
      })
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

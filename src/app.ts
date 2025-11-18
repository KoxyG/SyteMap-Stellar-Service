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

  // Trust proxy - required when behind a proxy (Render, Heroku, etc.)
  // This enables Express to trust X-Forwarded-* headers from the proxy
  app.set('trust proxy', true);

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

        // Create a fresh copy of the swagger document with updated server URL
        // Deep clone to preserve all paths, tags, and other properties
        const dynamicSwaggerDoc = JSON.parse(JSON.stringify(swaggerDocument));

        // Ensure paths are preserved (they should be, but let's be explicit)
        if (!dynamicSwaggerDoc.paths) {
          dynamicSwaggerDoc.paths = swaggerDocument.paths;
        }

        // Update server URL
        dynamicSwaggerDoc.servers = [
          {
            url: `${serverUrl}/api/v1`,
            description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
          },
        ];

        // swaggerUi.setup returns an array of middleware functions
        // Pass the spec directly (not as a URL) to ensure all paths are displayed
        const handlers = swaggerUi.setup(dynamicSwaggerDoc, {
          customCss: '.swagger-ui .topbar { display: none }',
          swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            tryItOutEnabled: true,
          },
          customSiteTitle: 'API Documentation',
        });

        // Execute the first handler (which renders the UI)
        if (Array.isArray(handlers)) {
          return handlers[0](req, res, next);
        }
        return handlers(req, res, next);
      };

      // Serve Swagger UI at /docs - handle all sub-paths for client-side routing
      app.use('/docs', swaggerUi.serve);
      
      // Serve the swagger JSON dynamically at /docs/swagger.json (MUST be before wildcard route)
      app.get('/docs/swagger.json', (req: Request, res: Response) => {
        const serverUrl = getServerUrl(req);
        // Deep clone to preserve all paths
        const dynamicSwaggerDoc = JSON.parse(JSON.stringify(swaggerDocument));
        
        // Ensure paths are preserved
        if (!dynamicSwaggerDoc.paths) {
          dynamicSwaggerDoc.paths = swaggerDocument.paths;
        }
        
        dynamicSwaggerDoc.servers = [
          {
            url: `${serverUrl}/api/v1`,
            description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
          },
        ];
        res.json(dynamicSwaggerDoc);
      });
      
      // Handle Swagger UI routes (must be after specific routes)
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

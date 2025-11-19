import fs from 'fs';
import path from 'path';
import swaggerAutogen from 'swagger-autogen';

import logger from '../utils/logger.utils';
import env from '../config/app.config';

const documentConfiguration = {
  info: {
    version: '1.0.0', // by default: '1.0.0'
    title: 'Node.js and TypeScript Backend Starter Kit', // by default: 'REST API'
    description:
      'Welcome to the Node.js and TypeScript Backend Starter Kit! This repository provides a robust foundation for building scalable and maintainable backend applications using Node.js and TypeScript. Perfect for developers looking to kickstart new projects without the repetitive setup tasks.', // by default: ''
  },
  servers: [
    {
      url: `${env.BASE_URL}/api/v1`,
      description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
    },
  ],
  tags: [
    {
      name: 'Stellar',
      description: 'Sytemap Stellar Blockchain API Endpoints',
    },
  ],
};

export const outputFile = path.resolve(__dirname, 'documentation.swagger.json');
// swagger-autogen needs to scan all route files, not just index
// The index file just imports/mounts other routes, but swagger comments are in the individual route files
const isProduction = __dirname.includes('dist');
const routesDir = isProduction
  ? path.resolve(__dirname, '../routes')
  : path.resolve(__dirname, '../routes');

// List all route files - swagger-autogen will scan all of them
const routes = isProduction
  ? [
      path.resolve(routesDir, 'default.routes.js'),
      path.resolve(routesDir, 'stellar.routes.js'),
      path.resolve(routesDir, 'errorTest.routes.js'),
    ]
  : [
      path.resolve(routesDir, 'default.routes'),
      path.resolve(routesDir, 'stellar.routes'),
      path.resolve(routesDir, 'errorTest.routes'),
    ];

// Generate swagger documentation and wait for completion
// This ensures the file is fully written before workers try to read it
const generateSwagger = async () => {
  try {
    logger.info(`Generating swagger documentation to: ${outputFile}`);
    logger.info(`Scanning routes from: ${routes.join(', ')}`);
    await swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, documentConfiguration);
    logger.info('Swagger Documentation Generated');

    // Verify the file was created and has paths
    if (fs.existsSync(outputFile)) {
      const swaggerDoc = JSON.parse(fs.readFileSync(outputFile, { encoding: 'utf-8' }));
      const pathCount = swaggerDoc.paths ? Object.keys(swaggerDoc.paths).length : 0;
      logger.info(`Swagger file created with ${pathCount} paths: ${Object.keys(swaggerDoc.paths || {}).join(', ')}`);

      if (pathCount === 0) {
        logger.warn('Swagger file generated but contains no paths! Check route files for swagger comments.');
      }
    } else {
      logger.error(`Swagger file not found at: ${outputFile}`);
    }
  } catch (error) {
    logger.error(`Failed to generate swagger documentation: ${error}`);
    throw error;
  }
};

// Export the promise so it can be awaited
export default generateSwagger();

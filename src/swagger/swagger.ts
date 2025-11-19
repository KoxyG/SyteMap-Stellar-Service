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
// swagger-autogen needs to scan route files with swagger comments
// Use source TypeScript files (works better than compiled JS for swagger-autogen)
// The index file combines all routes, but swagger comments are in individual route files
const routesDir = path.resolve(__dirname, '../routes');

// Use source TypeScript files - swagger-autogen can parse these better
// Pass index.ts which combines all routes, swagger-autogen will follow imports
const routes = [path.resolve(routesDir, 'index.ts')];

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

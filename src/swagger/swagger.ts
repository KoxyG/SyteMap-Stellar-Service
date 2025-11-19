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
// Use .js extension for compiled routes - swagger-autogen will scan the JS files
// In production, __dirname is dist/swagger, so this points to dist/routes/index.js
// In dev, __dirname is src/swagger (when using ts-node), but routes are in src/routes
const routesPath = __dirname.includes('dist')
  ? path.resolve(__dirname, '../routes/index.js')
  : path.resolve(__dirname, '../routes/index');
export const routes = [routesPath];

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

import path from 'path';
import swaggerAutogen from 'swagger-autogen';

import logger from '../utils/logger.utils';

const documentConfiguration = {
  info: {
    version: '1.0.0', // by default: '1.0.0'
    title: 'Node.js and TypeScript Backend Starter Kit', // by default: 'REST API'
    description:
      'Welcome to the Node.js and TypeScript Backend Starter Kit! This repository provides a robust foundation for building scalable and maintainable backend applications using Node.js and TypeScript. Perfect for developers looking to kickstart new projects without the repetitive setup tasks.', // by default: ''
  },
  servers: [
    {
      url: 'http://localhost:8000/api/v1', // by default: 'http://localhost:3000'
      description: '', // by default: ''
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
export const routes = [path.resolve(__dirname, '../routes/index')];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, documentConfiguration)
  .then(() => logger.info('Swagger Documentation Generated'))
  .catch((error) => logger.info(error));

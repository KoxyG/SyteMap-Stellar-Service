import cluster from 'cluster';

import env from './config/app.config';
import app from './app';
import logger from './utils/logger.utils';

if (cluster.isPrimary) {
  // generate swagger documentation - wait for it to complete before starting workers
  // This ensures the swagger file exists when workers try to load it
  (async function () {
    try {
      // Import and await the swagger generation promise
      const swaggerPromise = await import('./swagger/swagger');
      // The default export is the promise, await it
      await swaggerPromise.default;
      logger.info('Swagger documentation generation completed, starting workers...');
    } catch (error) {
      logger.error(`Failed to generate swagger documentation: ${error}`);
    }
    
    // TODO: style recommendation: set below statement background color green and foreground color black
    // TODO: add teminal bell when server starts
    logger.info(`Primary Process Starting ${env.NUMBER_OF_WORKERS} Workers!`);

    for (let worker = 1; worker <= env.NUMBER_OF_WORKERS; worker++) cluster.fork();
  })();

  // when a worker starts
  cluster.on('online', (workerInfo) => logger.info(`Worker with Process ${workerInfo.process.pid} Started!`));

  // start a new worker whenever a worker dies of some error
  cluster.on('exit', (worker, code, signal) => {
    logger.error('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    logger.info('Starting a new worker');
    cluster.fork();
  });
} else {
  // create express app
  const expressApp = app();
  // start listening to requests
  // Bind to 0.0.0.0 to accept connections from all interfaces (required for Render/Docker)
  // Check if PORT env var is set (Render/Heroku/Docker) or NODE_ENV is production
  // Always use 0.0.0.0 if PORT is set, as it's a reliable indicator of cloud deployment
  // Render always provides PORT, so this ensures binding to 0.0.0.0 on Render
  const hasPort = !!process.env.PORT;
  const isProduction = process.env.NODE_ENV === 'production';
  const host = hasPort || isProduction ? '0.0.0.0' : 'localhost';
  expressApp.listen(env.APP_PORT, host, () => {
    logger.info('=== SERVER STARTED ===');
    logger.info(`Server is up & running on http://${host}:${env.APP_PORT}`);
    if (env.BASE_URL && env.BASE_URL !== `http://${host}:${env.APP_PORT}`) {
      logger.info(`Public URL: ${env.BASE_URL}`);
    }
  });
}

// catch termination signals from system (system level interruptions)
process.on('SIGTERM', () => {
  logger.error('SIGTERM SIGNAL! Shutting down...');
  process.exit(1);
});

// catch termination signals from user (user level interruptions like Ctrl + C)
process.on('SIGINT', () => {
  logger.error('SIGINT SIGNAL! Shutting down...');
  process.exit(1);
});

// catch any error that is not catched properly
process.on('uncaughtException', (error) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... \n ${error}`);
  process.exit(1);
});
// catch any error that is not handled properly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('unhandledRejection', (error: any) => {
  logger.error(`UNHANDLED REJECTION! Shutting down... \n ${error}`);
  process.exit(1);
});

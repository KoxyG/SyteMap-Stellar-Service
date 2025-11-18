import { cpus } from 'os';

import dotenv from 'dotenv';
dotenv.config();

const getNoOfWorkers = (workers: string | undefined, isNoOfCpus: string | undefined): number => {
  // NO_OF_CPUS_AS_WORKERS is true
  if (typeof isNoOfCpus === 'string' && isNoOfCpus === 'true') return cpus().length;
  //
  if (typeof workers === 'string') return parseInt(workers);
  // default
  return 1;
};

// Render provides PORT, but we can override with APP_PORT if needed
const getPort = (): number => {
  if (process.env.PORT) return parseInt(process.env.PORT, 10);
  if (process.env.APP_PORT) return parseInt(process.env.APP_PORT, 10);
  return 8000;
};

// Get base URL for Swagger/API documentation
const getBaseUrl = (): string => {
  // Render provides RENDER_EXTERNAL_URL in production
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  // Vercel provides VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to localhost for development
  const port = getPort();
  return `http://localhost:${port}`;
};

export default {
  APP_PORT: getPort(),
  BASE_URL: getBaseUrl(),
  NODE_ENV: process.env.NODE_ENV || 'development',
  NUMBER_OF_WORKERS: getNoOfWorkers(process.env.NO_OF_WORKERS, process.env.NO_OF_CPUS_AS_WORKERS),
};

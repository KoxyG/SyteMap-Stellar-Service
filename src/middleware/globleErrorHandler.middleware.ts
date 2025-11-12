import { NextFunction, Request, Response } from 'express';

import CustomError from '../utils/customError.utils';
import logger from '../utils/logger.utils';
import appConfig from '../config/app.config';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler = (err: Error | CustomError, req: Request, res: Response, next: NextFunction) => {
  // Default error response
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let userFriendlyMessage = 'Something went wrong. Please try again later.';
  const isProduction = appConfig.NODE_ENV === 'production';

  // Custom error handling
  if (err instanceof CustomError) {
    // Operational error (e.g., missing parameters)
    statusCode = err.statusCode || 400;
    message = err.message || 'An operational error occurred';
    userFriendlyMessage = message;

    logger.error(`${message} | Path: ${req.path} | Method: ${req.method}`);
  } else if (err.name === 'ValidationError') {
    // JSON or request validation error
    statusCode = 400;
    message = 'Invalid data provided';
    userFriendlyMessage = 'Please check the input data and try again.';

    logger.error(`${userFriendlyMessage} | Path: ${req.path}`);
  } else if (err.name === 'SyntaxError') {
    // JSON parsing error
    statusCode = 400;
    message = 'Bad Request: Invalid JSON';
    userFriendlyMessage = 'The request body contains invalid JSON. Please check and try again.';

    logger.error(`${userFriendlyMessage} | Path: ${req.path}`);
  } else if (err.name === 'TypeError') {
    // Programmer error (e.g., undefined variable)
    // Do not expose details to the user
    message = 'A programmer error occurred';
    userFriendlyMessage = 'Something went wrong on our end. Please try again later.';

    logger.error(`${message}: ${err.message} | Stack: ${err.stack}`);
  } else if (err.name === 'ReferenceError' || err.name === 'RangeError') {
    // Other common programmer errors
    message = 'A system error occurred';
    userFriendlyMessage = 'We encountered a problem. Please try again later.';

    logger.error(`${message}: ${err.message} | Stack: ${err.stack}`);
  } else {
    // Unknown error
    logger.error(`Unhandled error: ${err.message} | Stack: ${err.stack}`);
  }

  // Response object structure
  const errorResponse: {
    status: string;
    message: string;
    detail: string;
    stack?: string;
    path?: string;
    timestamp?: string;
  } = {
    status: 'error',
    message: isProduction ? userFriendlyMessage : message,
    detail: userFriendlyMessage,
  };

  // Only include stack trace in development mode
  if (!isProduction) {
    errorResponse.stack = err.stack;
    errorResponse.path = req.path;
    errorResponse.timestamp = new Date().toISOString();
  }

  // Send a structured response to the user
  res.status(statusCode).json(errorResponse);
};

export default globalErrorHandler;

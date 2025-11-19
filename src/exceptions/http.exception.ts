/**
 * HTTP Exception
 * Custom exception class for HTTP errors with retry support
 */
export class HttpException extends Error {
  public status: number;
  public response: {
    status: number;
    success: boolean;
    message: string;
    errorCode?: string;
    retryable?: boolean;
    retryAfter?: number; // seconds
    details?: string;
  };

  constructor(
    response: {
      status: number;
      success: boolean;
      message: string;
      errorCode?: string;
      retryable?: boolean;
      retryAfter?: number;
      details?: string;
    },
    status: number
  ) {
    super(response.message);
    this.status = status;
    this.response = response;
    this.name = 'HttpException';
    Error.captureStackTrace(this, this.constructor);
  }
}

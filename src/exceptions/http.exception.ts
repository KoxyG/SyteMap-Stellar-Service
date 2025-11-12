/**
 * HTTP Exception
 * Custom exception class for HTTP errors
 */
export class HttpException extends Error {
  public status: number;
  public response: {
    status: number;
    success: boolean;
    message: string;
  };

  constructor(
    response: {
      status: number;
      success: boolean;
      message: string;
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

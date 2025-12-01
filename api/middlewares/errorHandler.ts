import { Request, Response, NextFunction } from 'express';
import { ErrorResponse, ValidationErrorResponse } from '../types/api.types';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let error = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    error = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    error = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    error = 'Invalid ID format';
  }

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const errorResponse: ErrorResponse = {
    success: false,
    error,
    message,
    statusCode
  };

  res.status(statusCode).json(errorResponse);
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
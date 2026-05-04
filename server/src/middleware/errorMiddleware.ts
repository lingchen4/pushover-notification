import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/validation';
import logger from '../utils/logger';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: 'ValidationError', message: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: 'NotFoundError', message: err.message });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'InternalServerError', message: 'An unexpected error occurred' });
}

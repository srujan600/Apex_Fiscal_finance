import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

/**
 * In-memory sliding window rate limiter.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const store = new Map<string, RateLimitRecord>();

  // Periodic cleanup every 60s
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < options.windowMs);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 60000).unref(); // unref so it does not block node exit

  return (req: Request, res: Response, next: NextFunction): void => {
    // In automated test suites, allow bypass unless explicitly testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const now = Date.now();
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.ip || req.socket.remoteAddress || 'unknown-client') + `:${req.user?.id || 'anon'}`;

    let record = store.get(key);
    if (!record) {
      record = { timestamps: [] };
      store.set(key, record);
    }

    // Filter out expired timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((t) => now - t < options.windowMs);

    const currentCount = record.timestamps.length;
    const remaining = Math.max(0, options.maxRequests - currentCount - 1);
    const resetTimeSec = Math.ceil((record.timestamps[0] ? record.timestamps[0] + options.windowMs - now : options.windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.max(0, resetTimeSec));

    if (currentCount >= options.maxRequests) {
      res.setHeader('Retry-After', Math.max(1, resetTimeSec));
      return next(
        new AppError(
          `Rate limit exceeded. Maximum ${options.maxRequests} requests per ${Math.round(options.windowMs / 1000)} seconds.`,
          429,
          'RATE_LIMIT_EXCEEDED'
        )
      );
    }

    record.timestamps.push(now);
    next();
  };
}

// Global API limiter: 300 requests per minute
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
});

// Strict limiter for sensitive financial mutations (reallocation, sovereign override, killswitch):
export const strictMutationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

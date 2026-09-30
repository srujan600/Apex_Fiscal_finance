import { Request, Response, NextFunction } from 'express';

/**
 * Structured request logging middleware.
 * Strips secrets, tokens, and sensitive headers.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const role = (req as any).user?.role || req.headers['x-user-role'] || 'ANONYMOUS';

    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      path: originalUrl.split('?')[0],
      status,
      durationMs: duration,
      role,
      ip: ip || 'unknown',
    };

    // Print cleanly formatted server log
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(
      `[${logEntry.timestamp}] ${statusColor}${method} ${logEntry.path} ${status}${reset} - ${duration}ms (Role: ${role})`
    );
  });

  next();
}

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Sets enterprise security headers according to OWASP Top 10 recommendations.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking via iframes
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection legacy filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content-Security-Policy (API default)
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");

  // Cache-Control for sensitive financial data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
}

/**
 * Validates request payload against prototype pollution and dangerous properties.
 */
export function sanitizePayloadGuard(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj: any) => {
      for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          throw new AppError('Forbidden payload key detected', 400, 'MALICIOUS_PAYLOAD');
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkObject(obj[key]);
        }
      }
    };

    try {
      checkObject(req.body);
    } catch (err) {
      return next(err);
    }
  }

  next();
}

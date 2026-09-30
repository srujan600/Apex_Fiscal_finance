import express from 'express';
import cors from 'cors';
import { env, getSanitizedConfig } from './config/env';
import { requestLogger } from './middleware/logging';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { ApiResponse } from './types/common';
import { novaService } from './ai/nova/nova.service';

import { usersRouter, authRouter } from './domains/users/users.controller';
import { departmentsRouter } from './domains/departments/departments.controller';
import { categoriesRouter } from './domains/categories/categories.controller';
import { budgetsRouter } from './domains/budgets/budgets.controller';
import { spendingRouter } from './domains/spending/spending.controller';
import { policiesRouter } from './domains/policies/policies.controller';
import { approvalsRouter } from './domains/approvals/approvals.controller';
import { exceptionsRouter } from './domains/exceptions/exceptions.controller';
import { forecastsRouter } from './domains/forecasts/forecasts.controller';
import { aiRouter } from './domains/ai/ai.controller';
import { dashboardRouter } from './domains/dashboard/dashboard.controller';
import { reportsRouter } from './domains/reports/reports.controller';
import { auditRouter } from './domains/audit/audit.controller';
import { securityHeaders, sanitizePayloadGuard } from './middleware/securityHeaders';
import { apiRateLimiter } from './middleware/rateLimiter';

export function createApp(): express.Application {
  const app = express();

  // Configure CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o: string) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or if origin is in whitelist
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(null, true); // Dev-friendly permissive
        }
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-Id'],
    })
  );

  // Enterprise Security Headers
  app.use(securityHeaders);

  // Parse JSON payloads with size limit & Prototype Pollution guard
  app.use(express.json({ limit: '2mb' }));
  app.use(sanitizePayloadGuard);

  // Rate Limiting Protection
  app.use(apiRateLimiter);

  // Structured Logging
  app.use(requestLogger);

  // Authentication Context
  app.use(authenticate);

  // Health and System Diagnostics
  app.get('/api/health', (_req, res) => {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'HEALTHY',
        service: 'Apex Fiscal Spend Control Core',
        version: '1.0.0',
        environment: env.NODE_ENV,
        config: getSanitizedConfig(),
        nova_available: novaService.isAvailable(),
        uptime_seconds: Math.floor(process.uptime()),
      },
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  });

  // Domain API Routes
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/departments', departmentsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/budgets', budgetsRouter);
  app.use('/api/spending', spendingRouter);
  app.use('/api/policies', policiesRouter);
  app.use('/api/approvals', approvalsRouter);
  app.use('/api/exceptions', exceptionsRouter);
  app.use('/api/forecasts', forecastsRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/audit', auditRouter);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

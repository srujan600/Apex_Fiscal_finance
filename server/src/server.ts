import { createApp } from './app';
import { env } from './config/env';
import { getDb, closeDb } from './db/connection';
import { initSchema } from './db/schema';
import { seedDatabase } from './db/seed';

export function startServer() {
  console.log('------------------------------------------------------------');
  console.log('Initializing APEX FISCAL Spend Control Backend Engine...');
  console.log('------------------------------------------------------------');

  // 1. Initialize SQLite Database
  const db = getDb();
  initSchema(db);
  seedDatabase(db);
  console.log(`[Database] SQLite connected successfully at: ${env.DATABASE_PATH}`);

  // 2. Initialize App
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Apex Fiscal API server running on port: ${env.PORT}`);
    console.log(`[Health] Status available at: http://localhost:${env.PORT}/api/health`);
    console.log(`[Nova] Aczen Nova API endpoint configured: ${env.NOVA_BASE_URL}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\nGracefully shutting down Apex Fiscal server...');
    server.close(() => {
      closeDb();
      console.log('Server and database closed safely.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}

// Start immediately when executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

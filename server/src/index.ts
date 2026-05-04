import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { migrate } from './db/migrate';
import { pruneOldEvents } from './utils/eventLogger';
import { restartAllEnabledJobs } from './services/schedulerService';
import cardRoutes from './routes/cardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import eventRoutes from './routes/eventRoutes';
import { errorMiddleware } from './middleware/errorMiddleware';
import logger from './utils/logger';

const PORT = process.env['PORT'] ?? 3001;
const IS_PROD = process.env['NODE_ENV'] === 'production';

const app = express();

app.use(cors({ origin: IS_PROD ? false : 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/cards', cardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/events', eventRoutes);

// Serve built React client in production
if (IS_PROD) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
}

app.use(errorMiddleware);

migrate();
pruneOldEvents();
restartAllEnabledJobs();

const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { port: PORT, env: process.env['NODE_ENV'] });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

export default app;

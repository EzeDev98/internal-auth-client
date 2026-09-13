import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { connectRedis } from './lib/redisClient.js';
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import usersRoutes from './routes/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await connectRedis();

  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/bff/auth', authRoutes);
  app.use('/bff/clients', clientsRoutes);
  app.use('/bff/users', usersRoutes);

  app.get('/bff/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

  // Same-origin production serving of the built SPA - guarded by
  // fs.existsSync so this is a no-op until Step 3's build actually exists.
  const spaDist = path.resolve(__dirname, '..', '..', 'dist');
  if (env.nodeEnv === 'production' && fs.existsSync(spaDist)) {
    app.use(express.static(spaDist));
    app.get('*', (req, res) => res.sendFile(path.join(spaDist, 'index.html')));
  }

  app.listen(env.port, () => {
    console.log(`[bff] listening on port ${env.port}`);
  });
}

main().catch((err) => {
  console.error('[bff] failed to start', err);
  process.exit(1);
});

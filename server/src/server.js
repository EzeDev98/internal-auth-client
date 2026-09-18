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
import rolesRoutes from './routes/roles.js';
import groupsRoutes from './routes/groups.js';
import sessionsRoutes from './routes/sessions.js';
import settingsRoutes from './routes/settings.js';

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
  app.use('/bff/roles', rolesRoutes);
  app.use('/bff/groups', groupsRoutes);
  app.use('/bff/sessions', sessionsRoutes);
  app.use('/bff/settings', settingsRoutes);

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

  startKeepAlive();
}

// Render spins a free web service down after a period with no inbound
// requests. This self-pings the service's own public URL every 3 minutes
// so Render keeps seeing traffic - mirrors internal-auth-server's own
// KeepAliveJob. RENDER_EXTERNAL_URL is injected automatically by Render
// (no dashboard env var to set), so this is a no-op anywhere else (local
// dev, CI) rather than pinging localhost.
function startKeepAlive() {
  const selfUrl = process.env.RENDER_EXTERNAL_URL;
  if (!selfUrl) return;

  setInterval(() => {
    fetch(`${selfUrl}/bff/health`).catch((err) => {
      console.warn('[keep-alive] self-ping failed', err.message);
    });
  }, 180_000);
}

main().catch((err) => {
  console.error('[bff] failed to start', err);
  process.exit(1);
});

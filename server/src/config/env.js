import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  authServerBaseUrl: required('AUTH_SERVER_BASE_URL'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:5173'),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? 'sid',
  csrfCookieName: process.env.CSRF_COOKIE_NAME ?? 'csrfToken',
  sessionTtlFallbackSeconds: Number(process.env.SESSION_TTL_FALLBACK_SECONDS ?? 86400),
  // Settings - Danger zone "wipe everything" button (WipeAllService on
  // internal-auth-server). Must be the same value as that server's own
  // ADMIN_RESET_SECRET/admin.reset.secret - the BFF holds it server-side
  // only and attaches it as X-Reset-Secret on the one outbound call that
  // needs it (authServerClient.js#wipeAll), so it never reaches the
  // browser. Blank by default: fails closed, same posture as the server.
  adminResetSecret: process.env.ADMIN_RESET_SECRET ?? '',
};

export const isProd = env.nodeEnv === 'production';

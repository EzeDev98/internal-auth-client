// Double-submit cookie CSRF protection for state-changing requests.
import crypto from 'node:crypto';
import { env, isProd } from '../config/env.js';

export function issueCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(env.csrfCookieName, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });
  return token;
}

export function verifyCsrf(req, res, next) {
  const cookieToken = req.cookies?.[env.csrfCookieName];
  const headerToken = req.get('X-CSRF-Token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, message: 'CSRF token missing or invalid' });
  }
  return next();
}

import crypto from 'node:crypto';
import { env, isProd } from '../config/env.js';

// Double-submit cookie: readable by the SPA's JS (httpOnly:false) so it can
// echo the value back in X-CSRF-Token on mutating requests. Only meaningful
// once a session cookie already exists, so this is applied to /refresh and
// /logout, not the pre-session /login and /login/verify-otp calls.
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

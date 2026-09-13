import { Router } from 'express';
import crypto from 'node:crypto';
import { env, isProd } from '../config/env.js';
import {
  adminLogin,
  adminVerifyLoginOtp,
  adminRefreshToken,
  logoutSession,
} from '../lib/authServerClient.js';
import { saveSession, deleteSession } from '../lib/sessionStore.js';
import { issueCsrfCookie, verifyCsrf } from '../middleware/csrf.js';
import { requireSession } from '../middleware/requireSession.js';

const router = Router();

function sessionCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  };
}

// Creates a brand-new session (login / verify-otp only). Refresh updates the
// existing session record in place instead - see /refresh below - so it
// doesn't orphan the old redis key.
async function establishSession(res, loginData) {
  const sid = crypto.randomUUID();
  const ttlSeconds = loginData.refreshExpiresIn
    ? Number(loginData.refreshExpiresIn)
    : env.sessionTtlFallbackSeconds;

  await saveSession(sid, {
    userId: loginData.userId,
    username: loginData.username,
    accessToken: loginData.accessToken,
    refreshToken: loginData.refreshToken,
    accessExpiresIn: loginData.expiresIn,
  }, ttlSeconds);

  res.cookie(env.sessionCookieName, sid, sessionCookieOptions(ttlSeconds));
  issueCsrfCookie(res);
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password are required' });
  }

  const upstream = await adminLogin(username, password);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }

  if (body.data?.mfaRequired) {
    return res.json({ success: true, message: body.message, data: { mfaRequired: true } });
  }

  await establishSession(res, body.data);
  return res.json({
    success: true,
    message: body.message,
    data: { userId: body.data.userId, username: body.data.username },
  });
});

router.post('/login/verify-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body ?? {};
  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: 'phoneNumber and otp are required' });
  }

  const upstream = await adminVerifyLoginOtp(phoneNumber, otp);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }

  await establishSession(res, body.data);
  return res.json({
    success: true,
    message: body.message,
    data: { userId: body.data.userId, username: body.data.username },
  });
});

router.post('/refresh', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await adminRefreshToken(req.session.refreshToken);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    await deleteSession(req.sid);
    res.clearCookie(env.sessionCookieName, { path: '/' });
    res.clearCookie(env.csrfCookieName, { path: '/' });
    return res.status(upstream.status).json(body);
  }

  const ttlSeconds = body.data.refreshExpiresIn
    ? Number(body.data.refreshExpiresIn)
    : env.sessionTtlFallbackSeconds;

  await saveSession(req.sid, {
    userId: body.data.userId ?? req.session.userId,
    username: body.data.username ?? req.session.username,
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    accessExpiresIn: body.data.expiresIn,
  }, ttlSeconds);

  res.cookie(env.sessionCookieName, req.sid, sessionCookieOptions(ttlSeconds));
  return res.json({ success: true, message: body.message, data: {} });
});

router.delete('/logout', requireSession, verifyCsrf, async (req, res) => {
  try {
    await logoutSession(req.session.accessToken);
  } catch (err) {
    console.error('[auth] upstream logout call failed, clearing local session anyway', err);
  }
  await deleteSession(req.sid);
  res.clearCookie(env.sessionCookieName, { path: '/' });
  res.clearCookie(env.csrfCookieName, { path: '/' });
  return res.json({ success: true, message: 'Logged out' });
});

router.get('/me', requireSession, (req, res) => {
  return res.json({
    success: true,
    data: { userId: req.session.userId, username: req.session.username },
  });
});

export default router;

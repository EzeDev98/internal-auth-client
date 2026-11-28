// Rejects requests that have no valid BFF session.
import { env } from '../config/env.js';
import { readSession } from '../lib/sessionStore.js';

export async function requireSession(req, res, next) {
  const sid = req.cookies?.[env.sessionCookieName];
  if (!sid) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const session = await readSession(sid);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Session expired' });
  }
  req.sid = sid;
  req.session = session;
  return next();
}

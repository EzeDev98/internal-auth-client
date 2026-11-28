// Routes for signing keys and the full data wipe.
import { Router } from 'express';
import { listSigningKeys, rotateSigningKey, wipeAll } from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.get('/signing-keys', requireSession, async (req, res) => {
  const upstream = await listSigningKeys(req.session.accessToken);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.post('/signing-keys/rotate', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await rotateSigningKey(req.session.accessToken);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.post('/wipe-all', requireSession, verifyCsrf, async (req, res) => {
  const { confirmation, includeSystemWallet } = req.body ?? {};
  const upstream = await wipeAll(confirmation, Boolean(includeSystemWallet));
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

export default router;

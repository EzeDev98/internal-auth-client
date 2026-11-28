// Route for listing user sessions.
import { Router } from 'express';
import { listSessions } from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';

const router = Router();

router.get('/', requireSession, async (req, res) => {
  const { ipAddress, device, active, page, size } = req.query;
  const upstream = await listSessions(req.session.accessToken, {
    ipAddress: ipAddress || undefined,
    device: device || undefined,
    active: active === undefined || active === '' ? undefined : active === 'true',
    page: page !== undefined ? Number(page) : undefined,
    size: size !== undefined ? Number(size) : undefined,
  });
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

export default router;

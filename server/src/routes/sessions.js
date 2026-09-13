import { Router } from 'express';
import { listSessions } from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';

const router = Router();

// Step 10A - standalone Sessions - List screen, backed by the same
// GET /admin/sessions Step 2E already wired for the Users - Detail
// Sessions tab (server/src/routes/users.js), but with no username/
// clientId forced - every filter here is optional and passed straight
// through. GET, so no CSRF check, same pattern as every other list route.
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

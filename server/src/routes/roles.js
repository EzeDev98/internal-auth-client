import { Router } from 'express';
import { listRoles, createRole, getRole } from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

// Step 8A - list is a GET, so no CSRF check (same pattern as
// /bff/clients' list route); requireSession is what matters, since this
// proxies an admin-only upstream endpoint using the session's own
// accessToken.
router.get('/', requireSession, async (req, res) => {
  const upstream = await listRoles(req.session.accessToken);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Step 8B - create modal. verifyCsrf applies since this mutates state.
router.post('/', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await createRole(req.session.accessToken, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

// Step 8C - detail, backed by GET /roles/{id}.
router.get('/:id', requireSession, async (req, res) => {
  const upstream = await getRole(req.session.accessToken, req.params.id);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

export default router;

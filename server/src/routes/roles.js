// Routes for managing roles.
import { Router } from 'express';
import { listRoles, createRole, getRole } from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.get('/', requireSession, async (req, res) => {
  const upstream = await listRoles(req.session.accessToken);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.post('/', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await createRole(req.session.accessToken, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

router.get('/:id', requireSession, async (req, res) => {
  const upstream = await getRole(req.session.accessToken, req.params.id);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

export default router;

// Routes for managing client applications.
import { Router } from 'express';
import {
  listClientApplications,
  createClientApplication,
  getClientApplication,
  updateClientApplication,
  rotateClientSecret,
} from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.get('/', requireSession, async (req, res) => {
  const { enabled, type, page, size } = req.query;
  const upstream = await listClientApplications(req.session.accessToken, { enabled, type, page, size });
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.post('/', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await createClientApplication(req.session.accessToken, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

router.get('/:clientId', requireSession, async (req, res) => {
  const upstream = await getClientApplication(req.session.accessToken, req.params.clientId);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.patch('/:clientId', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await updateClientApplication(req.session.accessToken, req.params.clientId, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.post('/:clientId/rotate-secret', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await rotateClientSecret(req.session.accessToken, req.params.clientId);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

export default router;

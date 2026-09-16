import { Router } from 'express';
import {
  listUsers,
  getUser,
  updateUser,
  getUserRoles,
  assignRoleToUser,
  unassignRole,
  getUserPermissionGroups,
  getUserCredential,
  resetUserPassword,
  listSessions,
  createUser,
  invalidateUserSession,
} from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

// Step 7A - list.
router.get('/', requireSession, async (req, res) => {
  const { clientId, search, enabled, page, size } = req.query;
  const upstream = await listUsers(req.session.accessToken, { clientId, search, enabled, page, size });
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Step 7C - create modal. verifyCsrf applies since this mutates state,
// same pattern as clients.js's POST /.
router.post('/', requireSession, verifyCsrf, async (req, res) => {
  const { clientId } = req.query;
  const upstream = await createUser(req.session.accessToken, clientId, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

// Step 7B - detail tabs. clientId is required by the upstream endpoint
// (username alone doesn't identify a user - see authServerClient.js's
// comment), passed through as a query param the same way the frontend
// already carries it from the list.
router.get('/:username', requireSession, async (req, res) => {
  const upstream = await getUser(req.session.accessToken, req.params.username, req.query.clientId);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Overview tab Save action. Mutates state, so verifyCsrf applies, same
// pattern as this router's own POST / above.
router.patch('/:username', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await updateUser(req.session.accessToken, req.params.username, req.query.clientId, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.get('/:username/roles', requireSession, async (req, res) => {
  const upstream = await getUserRoles(req.session.accessToken, req.params.username);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Roles tab "Assign role" modal. Mutates state, so verifyCsrf applies.
router.post('/:username/roles', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await assignRoleToUser(req.session.accessToken, req.params.username, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

// Roles tab "Unassign" action. Mutates state, so verifyCsrf applies.
router.delete('/:username/roles/:roleName', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await unassignRole(req.session.accessToken, req.params.username, req.params.roleName);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.get('/:username/permission-groups', requireSession, async (req, res) => {
  const upstream = await getUserPermissionGroups(req.session.accessToken, req.params.username);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Step 2H - Credentials tab. Same clientId-required pattern as GET
// /:username above (username alone doesn't identify a user).
router.get('/:username/credentials', requireSession, async (req, res) => {
  const upstream = await getUserCredential(req.session.accessToken, req.params.username, req.query.clientId);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Step 2H - Credentials tab "Reset password" action. Mutates state, so
// verifyCsrf applies, same pattern as this router's own POST / above.
router.post('/:username/credentials/reset', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await resetUserPassword(req.session.accessToken, req.params.username, req.query.clientId, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.get('/:username/sessions', requireSession, async (req, res) => {
  const upstream = await listSessions(req.session.accessToken, {
    username: req.params.username,
    clientId: req.query.clientId,
    page: req.query.page,
    size: req.query.size,
  });
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Step 10B - Sessions - List Revoke action. Mutates state, so verifyCsrf
// applies, same pattern as this router's own POST / above. clientId is
// required by the upstream endpoint (see authServerClient.js's comment on
// invalidateUserSession) and is passed through as a query param, same way
// GET /:username already carries it.
router.delete('/:username/sessions', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await invalidateUserSession(req.session.accessToken, req.params.username, req.query.clientId);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

export default router;

// Routes for managing groups and sub-groups.
import { Router } from 'express';
import {
  listGroups,
  listSubgroups,
  fetchGroupByName,
  createSuperGroup,
  createSubGroup,
  assignRoleToGroup,
  assignRoleToSubGroup,
  addUserToGroup,
  removeUserFromGroup,
  deleteSubGroup,
  renameSubGroup,
  moveSubGroup,
} from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.get('/', requireSession, async (req, res) => {
  const upstream = await listGroups(req.session.accessToken);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.get('/:groupName', requireSession, async (req, res) => {
  const upstream = await fetchGroupByName(req.session.accessToken, req.params.groupName);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.get('/:id/subgroups', requireSession, async (req, res) => {
  const upstream = await listSubgroups(req.session.accessToken, req.params.id);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.post('/', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await createSuperGroup(req.session.accessToken, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

router.post('/:parentGroupName/subgroups', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await createSubGroup(req.session.accessToken, req.params.parentGroupName, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

router.post('/:groupName/roles', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await assignRoleToGroup(req.session.accessToken, req.params.groupName, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

router.post('/:parentGroupName/subgroups/:subGroupName/roles', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await assignRoleToSubGroup(
    req.session.accessToken,
    req.params.parentGroupName,
    req.params.subGroupName,
    req.body,
  );
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

router.post('/:groupName/users', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await addUserToGroup(req.session.accessToken, req.params.groupName, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

router.delete('/:groupName/users/:username', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await removeUserFromGroup(req.session.accessToken, req.params.groupName, req.params.username);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.delete('/:parentGroupName/subgroups/:subGroupName', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await deleteSubGroup(req.session.accessToken, req.params.parentGroupName, req.params.subGroupName);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.patch('/:parentGroupName/subgroups/:subGroupName', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await renameSubGroup(
    req.session.accessToken,
    req.params.parentGroupName,
    req.params.subGroupName,
    req.body,
  );
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

router.patch('/:parentGroupName/subgroups/:subGroupName/move', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await moveSubGroup(
    req.session.accessToken,
    req.params.parentGroupName,
    req.params.subGroupName,
    req.body,
  );
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

export default router;

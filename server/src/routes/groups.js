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

// Step 9A - both routes are GETs, so no CSRF check (same pattern as
// roles.js's list route); requireSession is what matters, since this
// proxies admin-only upstream endpoints using the session's own
// accessToken.
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

// Step 9B - create modal (top-level group). verifyCsrf applies since this
// mutates state, same pattern as roles.js's POST / route.
router.post('/', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await createSuperGroup(req.session.accessToken, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

// Step 9B - create modal (subgroup).
router.post('/:parentGroupName/subgroups', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await createSubGroup(req.session.accessToken, req.params.parentGroupName, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

// Step 9B - assign-role modal (top-level group).
router.post('/:groupName/roles', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await assignRoleToGroup(req.session.accessToken, req.params.groupName, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

// Step 9B - assign-role modal (subgroup).
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

// Members tab "Add member" button - existing POST /groups/{groupName}/users
// (PermissionController#addUsersToGroup). verifyCsrf applies since this
// mutates state, same pattern as the assign-role/create routes above.
router.post('/:groupName/users', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await addUserToGroup(req.session.accessToken, req.params.groupName, req.body);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.status(201).json({ success: true, message: body.message, data: body.data });
});

// Permission Groups tab "Leave" action - existing DELETE
// /groups/{groupName}/users/{username} (PermissionController#removeUserFromGroup).
// verifyCsrf applies since this mutates state.
router.delete('/:groupName/users/:username', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await removeUserFromGroup(req.session.accessToken, req.params.groupName, req.params.username);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Child groups actions menu "Delete" action - existing DELETE
// /groups/{parentGroupName}/subgroups/{subGroupName}
// (PermissionController#deleteSubGroup). The Java endpoint already existed;
// only this proxy route was missing. verifyCsrf applies since this mutates
// state, same pattern as the other mutating routes above.
router.delete('/:parentGroupName/subgroups/:subGroupName', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await deleteSubGroup(req.session.accessToken, req.params.parentGroupName, req.params.subGroupName);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Child groups actions menu "Rename" action - new PATCH
// /groups/{parentGroupName}/subgroups/{subGroupName}
// (PermissionController#renameSubGroup).
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

// Child groups actions menu "Move" action - new PATCH
// /groups/{parentGroupName}/subgroups/{subGroupName}/move
// (PermissionController#moveSubGroup).
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

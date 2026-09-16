import { z } from 'zod';
import {
  bffGet, bffPost, bffPatch, bffDelete,
} from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import {
  pagedUsersSchema, userProfileSchema, userRoleSchema, userPermissionGroupSchema, userCredentialSchema,
} from './userResponseSchemas';
import { pagedSessionsSchema } from '../sessions/sessionResponseSchemas';

// Step 7A/7B - proxied by the BFF (server/src/routes/users.js), which
// forwards these using the session's own accessToken since
// AdminUserController is an authenticated admin-only endpoint.
//
// Step 12A - every GET below parses its response against
// userResponseSchemas.js (or, for getUserSessions, sessionResponseSchemas.js
// - it hits the same GET /admin/sessions upstream endpoint as the
// standalone Sessions - List screen, just username-filtered, so it's the
// same response shape) before returning it.
export function listUsers({ page = 0, size = 20, search, enabled } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('size', size);
  if (search) params.set('search', search);
  if (enabled !== undefined && enabled !== null) params.set('enabled', enabled);
  return bffGet(`/users?${params.toString()}`).then((data) => parseResponse(pagedUsersSchema, data));
}

// clientId is required upstream - username alone doesn't identify a user
// (see server/src/lib/authServerClient.js's comment). The Users list
// carries clientId on every row (Step 7A backend addition), so callers
// always have it by the time they navigate here.
export function getUser(username, clientId) {
  const params = new URLSearchParams({ clientId });
  return bffGet(`/users/${encodeURIComponent(username)}?${params.toString()}`)
    .then((data) => parseResponse(userProfileSchema, data));
}

// Overview tab Save action.
export function updateUser(username, clientId, payload) {
  const params = new URLSearchParams({ clientId });
  return bffPatch(`/users/${encodeURIComponent(username)}?${params.toString()}`, payload)
    .then((data) => parseResponse(userProfileSchema, data));
}

export function getUserRoles(username) {
  return bffGet(`/users/${encodeURIComponent(username)}/roles`)
    .then((data) => parseResponse(z.array(userRoleSchema), data));
}

// Roles tab "Assign role" modal.
export function assignRoleToUser(username, payload) {
  return bffPost(`/users/${encodeURIComponent(username)}/roles`, payload);
}

// Roles tab "Unassign" action.
export function unassignRole(username, roleName) {
  return bffDelete(`/users/${encodeURIComponent(username)}/roles/${encodeURIComponent(roleName)}`);
}

export function getUserPermissionGroups(username) {
  return bffGet(`/users/${encodeURIComponent(username)}/permission-groups`)
    .then((data) => parseResponse(z.array(userPermissionGroupSchema), data));
}

// Step 2H - Credentials tab. clientId is required for the same reason as
// getUser/getUserSessions above - username alone doesn't identify a user.
export function getUserCredential(username, clientId) {
  const params = new URLSearchParams({ clientId });
  return bffGet(`/users/${encodeURIComponent(username)}/credentials?${params.toString()}`)
    .then((data) => parseResponse(userCredentialSchema, data));
}

// Step 2H - Credentials tab "Reset password" action.
export function resetUserPassword(username, clientId, payload) {
  const params = new URLSearchParams({ clientId });
  return bffPost(`/users/${encodeURIComponent(username)}/credentials/reset?${params.toString()}`, payload);
}

export function getUserSessions(username, clientId) {
  const params = new URLSearchParams({ clientId });
  return bffGet(`/users/${encodeURIComponent(username)}/sessions?${params.toString()}`)
    .then((data) => parseResponse(pagedSessionsSchema, data));
}

// Step 7C - existing POST /users, usable today (AdminUserController's own
// Javadoc says so directly). clientId is required upstream since a created
// user is always scoped to one client application.
export function createUser(clientId, payload) {
  const params = new URLSearchParams({ clientId });
  return bffPost(`/users?${params.toString()}`, payload);
}

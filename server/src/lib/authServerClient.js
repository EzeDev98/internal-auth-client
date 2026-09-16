import axios from 'axios';
import { env } from '../config/env.js';

// validateStatus never throws - callers forward the auth server's own
// {success,message,data,errorCode} body and status code as-is, rather than
// this BFF inventing its own error shape for upstream failures.
const client = axios.create({
  baseURL: env.authServerBaseUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
});

export function adminLogin(username, password) {
  return client.post('/admin/login', { username, password });
}

export function adminVerifyLoginOtp(phoneNumber, otp) {
  return client.post('/admin/login/verify-otp', { phoneNumber, otp });
}

export function adminRefreshToken(refreshToken) {
  return client.post('/admin/refresh-token', { refreshToken });
}

export function logoutSession(accessToken) {
  return client.delete('/session', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 6A/6B - unlike login/register/password-reset above, these are
// authenticated admin endpoints (@PreAuthorize HAS_ADMIN on
// ClientApplicationController), so the BFF forwards the session's own
// accessToken as a bearer token rather than acting as an OAuth client
// itself. No silent-refresh-on-401 here yet - an expired access token
// surfaces as a 401 the frontend has to handle by asking to log in again
// (Step 12 cross-cutting hardening territory, not this pass).
export function listClientApplications(accessToken, { enabled, type, page, size } = {}) {
  const params = {};
  if (enabled !== undefined && enabled !== '') params.enabled = enabled;
  if (type) params.type = type;
  if (page !== undefined) params.page = page;
  if (size !== undefined) params.size = size;
  return client.get('/client-applications', {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createClientApplication(accessToken, payload) {
  return client.post('/client-applications', payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 6C - detail/edit. clientId here is the OAuth2 client_id string
// (ClientApplicationController's @PathVariable clientId), not the numeric
// id - confirmed by reading ClientApplicationServiceImpl, which resolves
// both getClientDetail and updateClient via findByClientId.
export function getClientApplication(accessToken, clientId) {
  return client.get(`/client-applications/${encodeURIComponent(clientId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function updateClientApplication(accessToken, clientId, payload) {
  return client.patch(`/client-applications/${encodeURIComponent(clientId)}`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 7A/7B - AdminUserController is admin-only, same bearer-forwarding
// pattern as the client-applications calls above. username is only unique
// per client_application_id (User's own class Javadoc, V8), so the
// single-user lookup below requires clientId - AdminUserServiceImpl's
// UserSummaryResponse (Step 7A) now includes it on every list row so the
// frontend always has it when navigating into a user's detail page.
export function listUsers(accessToken, { clientId, search, enabled, page, size } = {}) {
  const params = {};
  if (clientId) params.clientId = clientId;
  if (search) params.search = search;
  if (enabled !== undefined && enabled !== '') params.enabled = enabled;
  if (page !== undefined) params.page = page;
  if (size !== undefined) params.size = size;
  return client.get('/users', {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getUser(accessToken, username, clientId) {
  return client.get(`/users/${encodeURIComponent(username)}`, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Overview tab edit form - PATCH ${app.title}/users/{username}
// (AdminUserController#updateUser). clientId is required, same reason as
// getUser above.
export function updateUser(accessToken, username, clientId, payload) {
  return client.patch(`/users/${encodeURIComponent(username)}`, payload, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getUserRoles(accessToken, username) {
  return client.get(`/users/${encodeURIComponent(username)}/roles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getUserPermissionGroups(accessToken, username) {
  return client.get(`/users/${encodeURIComponent(username)}/permission-groups`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 2H - Users - Detail Credentials tab. New GET
// ${app.title}/users/{username}/credentials (AdminUserController#getCredential).
export function getUserCredential(accessToken, username, clientId) {
  return client.get(`/users/${encodeURIComponent(username)}/credentials`, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 2H - Credentials tab "Reset password" action. New POST
// ${app.title}/users/{username}/credentials/reset
// (AdminUserController#resetPassword) - sets the password directly (no
// OTP/token round trip, unlike the self-service completePasswordReset
// above) and invalidates the user's active session server-side.
export function resetUserPassword(accessToken, username, clientId, payload) {
  return client.post(`/users/${encodeURIComponent(username)}/credentials/reset`, payload, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Reused by the Users - Detail Sessions tab (Step 7B) today; Step 10's
// standalone Sessions - List screen will call the same upstream endpoint
// without a username filter.
export function listSessions(accessToken, { username, clientId, ipAddress, device, active, page, size } = {}) {
  const params = {};
  if (username) params.username = username;
  if (clientId) params.clientId = clientId;
  if (ipAddress) params.ipAddress = ipAddress;
  if (device) params.device = device;
  if (active !== undefined && active !== '') params.active = active;
  if (page !== undefined) params.page = page;
  if (size !== undefined) params.size = size;
  return client.get('/admin/sessions', {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 10B - Sessions - List Revoke action. The real upstream endpoint is
// DELETE ${app.title}/users/{username}/sessions?clientId=... (see
// UserSessionController#invalidateSession) - NOT "POST /session/invalidate"
// as the original plan assumed; that route doesn't exist on the server.
// clientId is required because username alone doesn't identify a unique
// account (see getUser's comment above) - the frontend now gets it from
// each session row's own clientId field (Step 10B, server-side).
export function invalidateUserSession(accessToken, username, clientId) {
  return client.delete(`/users/${encodeURIComponent(username)}/sessions`, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 11A - Settings - Signing keys panel. New GET
// ${app.title}/admin/signing-keys (SigningKeyController#list) - the plan
// only names the existing rotate endpoint below; nothing upstream exposed
// the current key/history a real panel needs to show before a rotate, so
// this endpoint is additive (same reasoning as Step 2H's password-reset
// endpoints).
export function listSigningKeys(accessToken) {
  return client.get('/admin/signing-keys', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 11A - existing POST /admin/signing-keys/rotate
// (SigningKeyController#rotate). No request body upstream.
export function rotateSigningKey(accessToken) {
  return client.post('/admin/signing-keys/rotate', {}, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 8A - PermissionController's GET /roles (@PreAuthorize HAS_ADMIN),
// same bearer-forwarding pattern as listClientApplications/listUsers
// above. Unpaginated - RoleQueryServiceImpl backs it with a plain
// findAll(), so no page/size params to forward.
export function listRoles(accessToken) {
  return client.get('/roles', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 8B - existing POST /roles (PermissionController#createRole),
// same bearer-forwarding pattern as createClientApplication above.
export function createRole(accessToken, payload) {
  return client.post('/roles', payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 8C - PermissionController's GET /roles/{id} (@PreAuthorize
// HAS_ADMIN), same bearer-forwarding pattern as getClientApplication/
// getUser above.
export function getRole(accessToken, id) {
  return client.get(`/roles/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 7C - existing POST /users (already usable per AdminUserController's
// own Javadoc, same as every other endpoint this feature turned out to
// already have). clientId is required as a query param, same as
// getUser/updateUser above - a created user is always scoped to one client
// application.
export function createUser(accessToken, clientId, payload) {
  return client.post('/users', payload, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Roles tab "Assign role" action - existing POST
// ${app.title}/users/{username}/roles (PermissionController#assignRoleToUser).
export function assignRoleToUser(accessToken, username, payload) {
  return client.post(`/users/${encodeURIComponent(username)}/roles`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Roles tab "Unassign" action - existing DELETE
// ${app.title}/users/{username}/roles/{roleName} (PermissionController#unassignRole).
export function unassignRole(accessToken, username, roleName) {
  return client.delete(`/users/${encodeURIComponent(username)}/roles/${encodeURIComponent(roleName)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 9A - PermissionController's GET /groups and GET /groups/{id}/subgroups
// (@PreAuthorize HAS_ADMIN), same bearer-forwarding pattern as
// listRoles/getRole above. Both are plain unpaginated queries
// (GroupQueryServiceImpl), so no page/size params to forward.
export function listGroups(accessToken) {
  return client.get('/groups', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function fetchGroupByName(accessToken, groupName) {
  return client.get(`/groups/${encodeURIComponent(groupName)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function listSubgroups(accessToken, id) {
  return client.get(`/groups/${encodeURIComponent(id)}/subgroups`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 9B - existing POST /groups (PermissionController#createSuperGroup),
// same bearer-forwarding pattern as createRole above.
export function createSuperGroup(accessToken, payload) {
  return client.post('/groups', payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 9B - existing POST /groups/{parentGroupName}/subgroups
// (PermissionController#createSubGroup), same bearer-forwarding pattern.
export function createSubGroup(accessToken, parentGroupName, payload) {
  return client.post(`/groups/${encodeURIComponent(parentGroupName)}/subgroups`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 9B - existing POST /groups/{groupName}/roles
// (PermissionController#assignRoleToGroup).
export function assignRoleToGroup(accessToken, groupName, payload) {
  return client.post(`/groups/${encodeURIComponent(groupName)}/roles`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Step 9B - existing POST /groups/{parentGroupName}/subgroups/{subGroupName}/roles
// (PermissionController#assignRoleToSubGroup).
export function assignRoleToSubGroup(accessToken, parentGroupName, subGroupName, payload) {
  return client.post(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}/roles`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

// Members tab - existing POST /groups/{groupName}/users
// (PermissionController#addUsersToGroup).
export function addUserToGroup(accessToken, groupName, payload) {
  return client.post(`/groups/${encodeURIComponent(groupName)}/users`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Permission Groups tab "Leave" action - existing DELETE
// ${app.title}/groups/{groupName}/users/{username}
// (PermissionController#removeUserFromGroup).
export function removeUserFromGroup(accessToken, groupName, username) {
  return client.delete(`/groups/${encodeURIComponent(groupName)}/users/${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// HTTP client the BFF uses to call internal-auth-server.
import axios from 'axios';
import { env } from '../config/env.js';

const client = axios.create({
  baseURL: env.authServerBaseUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
});

export function adminLogin(username, password) {
  return client.post('/admin/login', { username, password });
}

export function adminRefreshToken(refreshToken) {
  return client.post('/admin/refresh-token', { refreshToken });
}

export function logoutSession(accessToken) {
  return client.delete('/session', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

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

export function rotateClientSecret(accessToken, clientId) {
  return client.post(`/client-applications/${encodeURIComponent(clientId)}/rotate-secret`, {}, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

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

export function getUserCredential(accessToken, username, clientId) {
  return client.get(`/users/${encodeURIComponent(username)}/credentials`, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function resetUserPassword(accessToken, username, clientId, payload) {
  return client.post(`/users/${encodeURIComponent(username)}/credentials/reset`, payload, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

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

export function invalidateUserSession(accessToken, username, clientId) {
  return client.delete(`/users/${encodeURIComponent(username)}/sessions`, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function listSigningKeys(accessToken) {
  return client.get('/admin/signing-keys', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function rotateSigningKey(accessToken) {
  return client.post('/admin/signing-keys/rotate', {}, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function listRoles(accessToken) {
  return client.get('/roles', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createRole(accessToken, payload) {
  return client.post('/roles', payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getRole(accessToken, id) {
  return client.get(`/roles/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createUser(accessToken, clientId, payload) {
  return client.post('/users', payload, {
    params: { clientId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function assignRoleToUser(accessToken, username, payload) {
  return client.post(`/users/${encodeURIComponent(username)}/roles`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function unassignRole(accessToken, username, roleName) {
  return client.delete(`/users/${encodeURIComponent(username)}/roles/${encodeURIComponent(roleName)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

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

export function createSuperGroup(accessToken, payload) {
  return client.post('/groups', payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createSubGroup(accessToken, parentGroupName, payload) {
  return client.post(`/groups/${encodeURIComponent(parentGroupName)}/subgroups`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function assignRoleToGroup(accessToken, groupName, payload) {
  return client.post(`/groups/${encodeURIComponent(groupName)}/roles`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function assignRoleToSubGroup(accessToken, parentGroupName, subGroupName, payload) {
  return client.post(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}/roles`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export function addUserToGroup(accessToken, groupName, payload) {
  return client.post(`/groups/${encodeURIComponent(groupName)}/users`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function removeUserFromGroup(accessToken, groupName, username) {
  return client.delete(`/groups/${encodeURIComponent(groupName)}/users/${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function deleteSubGroup(accessToken, parentGroupName, subGroupName) {
  return client.delete(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export function renameSubGroup(accessToken, parentGroupName, subGroupName, payload) {
  return client.patch(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export function moveSubGroup(accessToken, parentGroupName, subGroupName, payload) {
  return client.patch(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}/move`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export function wipeAll(confirmation, includeSystemWallet) {
  return client.post(
    '/admin/reset/wipe-all',
    { confirmation, includeSystemWallet },
    { headers: { 'X-Reset-Secret': env.adminResetSecret } },
  );
}

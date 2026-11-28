// API calls for users.
import { z } from 'zod';
import {
  bffGet, bffPost, bffPatch, bffDelete,
} from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import {
  pagedUsersSchema, userProfileSchema, userRoleSchema, userPermissionGroupSchema, userCredentialSchema,
} from './userResponseSchemas';
import { pagedSessionsSchema } from '../sessions/sessionResponseSchemas';

export function listUsers({ page = 0, size = 20, search, enabled } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('size', size);
  if (search) params.set('search', search);
  if (enabled !== undefined && enabled !== null) params.set('enabled', enabled);
  return bffGet(`/users?${params.toString()}`).then((data) => parseResponse(pagedUsersSchema, data));
}

export function getUser(username, clientId) {
  const params = new URLSearchParams({ clientId });
  return bffGet(`/users/${encodeURIComponent(username)}?${params.toString()}`)
    .then((data) => parseResponse(userProfileSchema, data));
}

export function updateUser(username, clientId, payload) {
  const params = new URLSearchParams({ clientId });
  return bffPatch(`/users/${encodeURIComponent(username)}?${params.toString()}`, payload)
    .then((data) => parseResponse(userProfileSchema, data));
}

export function getUserRoles(username) {
  return bffGet(`/users/${encodeURIComponent(username)}/roles`)
    .then((data) => parseResponse(z.array(userRoleSchema), data));
}

export function assignRoleToUser(username, payload) {
  return bffPost(`/users/${encodeURIComponent(username)}/roles`, payload);
}

export function unassignRole(username, roleName) {
  return bffDelete(`/users/${encodeURIComponent(username)}/roles/${encodeURIComponent(roleName)}`);
}

export function getUserPermissionGroups(username) {
  return bffGet(`/users/${encodeURIComponent(username)}/permission-groups`)
    .then((data) => parseResponse(z.array(userPermissionGroupSchema), data));
}

export function getUserCredential(username, clientId) {
  const params = new URLSearchParams({ clientId });
  return bffGet(`/users/${encodeURIComponent(username)}/credentials?${params.toString()}`)
    .then((data) => parseResponse(userCredentialSchema, data));
}

export function resetUserPassword(username, clientId, payload) {
  const params = new URLSearchParams({ clientId });
  return bffPost(`/users/${encodeURIComponent(username)}/credentials/reset?${params.toString()}`, payload);
}

export function getUserSessions(username, clientId) {
  const params = new URLSearchParams({ clientId });
  return bffGet(`/users/${encodeURIComponent(username)}/sessions?${params.toString()}`)
    .then((data) => parseResponse(pagedSessionsSchema, data));
}

export function createUser(clientId, payload) {
  const params = new URLSearchParams({ clientId });
  return bffPost(`/users?${params.toString()}`, payload);
}

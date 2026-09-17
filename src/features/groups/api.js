import { z } from 'zod';
import { bffGet, bffPost, bffPatch, bffDelete } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { groupSummarySchema, subGroupSummarySchema, groupDetailSchema } from './groupResponseSchemas';

// Step 9A - proxied by the BFF (server/src/routes/groups.js), mirroring
// Step 8A's roles proxy: forwards using the session's own accessToken
// since PermissionController's GET /groups and GET /groups/{id}/subgroups
// are authenticated admin-only endpoints (PermissionController, Step 2D).
//
// Step 12A - both GET functions parse their response against
// groupResponseSchemas.js before returning it.
export function listGroups() {
  return bffGet('/groups').then((data) => parseResponse(z.array(groupSummarySchema), data));
}

export function listSubgroups(id) {
  return bffGet(`/groups/${encodeURIComponent(id)}/subgroups`)
    .then((data) => parseResponse(z.array(subGroupSummarySchema), data));
}

export function getGroup(groupName) {
  return bffGet(`/groups/${encodeURIComponent(groupName)}`)
    .then((data) => parseResponse(groupDetailSchema, data));
}

// Step 9B - existing POST /groups (top-level) and POST
// /groups/{parentGroupName}/subgroups, proxied by the BFF the same way
// as Step 9A's reads above.
export function createGroup(payload) {
  return bffPost('/groups', payload);
}

export function createSubgroup(parentGroupName, payload) {
  return bffPost(`/groups/${encodeURIComponent(parentGroupName)}/subgroups`, payload);
}

// Step 9B - existing POST /groups/{groupName}/roles and POST
// /groups/{parentGroupName}/subgroups/{subGroupName}/roles.
export function assignRoleToGroup(groupName, payload) {
  return bffPost(`/groups/${encodeURIComponent(groupName)}/roles`, payload);
}

export function assignRoleToSubgroup(parentGroupName, subGroupName, payload) {
  return bffPost(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}/roles`,
    payload,
  );
}

// renameSubgroup, moveSubgroup, and deleteSubgroup are all fully wired:
// PATCH/DELETE /groups/{parentGroupName}/subgroups/{subGroupName} (+
// /move) (PermissionController#renameSubGroup / #moveSubGroup /
// #deleteSubGroup), proxied by the BFF (server/src/routes/groups.js).
export function renameSubgroup(parentGroupName, subGroupName, payload) {
  return bffPatch(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}`,
    payload,
  );
}

export function moveSubgroup(parentGroupName, subGroupName, payload) {
  return bffPatch(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}/move`,
    payload,
  );
}

export function deleteSubgroup(parentGroupName, subGroupName) {
  return bffDelete(
    `/groups/${encodeURIComponent(parentGroupName)}/subgroups/${encodeURIComponent(subGroupName)}`,
  );
}

// Members tab - existing POST /groups/{groupName}/users
// (PermissionController#addUsersToGroup). Adds an existing user directly
// to the group, granting them every role already mapped to it.
export function addGroupMember(groupName, payload) {
  return bffPost(`/groups/${encodeURIComponent(groupName)}/users`, payload);
}

// Permission Groups tab "Leave" action.
export function removeGroupMember(groupName, username) {
  return bffDelete(`/groups/${encodeURIComponent(groupName)}/users/${encodeURIComponent(username)}`);
}

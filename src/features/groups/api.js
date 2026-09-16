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

// TODO(backend): none of these three exist yet, on the BFF or on
// internal-auth-server. PermissionController has no PUT/PATCH for groups
// or subgroups at all, and no move/re-parent endpoint - only the POST
// (create) and DELETE (subgroup delete) routes exist server-side today.
// These are wired up client-side ahead of that work landing, per the
// "Child groups" actions-menu request - each will 404/fail until:
//   - renameSubgroup: needs PATCH /groups/{parentGroupName}/subgroups/{subGroupName}
//     (new PermissionManagementService method + controller route + BFF proxy route)
//   - moveSubgroup: needs PATCH /groups/{parentGroupName}/subgroups/{subGroupName}/move
//     (new service method to re-parent a SubPermissionGroup + controller route + BFF proxy route)
//   - deleteSubgroup: the Java endpoint already exists
//     (DELETE /groups/{parentGroupName}/subgroups/{subGroupName}), but the BFF doesn't
//     proxy it yet - only that BFF route is missing, not the backend one.
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

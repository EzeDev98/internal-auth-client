import { z } from 'zod';
import { bffGet, bffPost } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { groupSummarySchema, subGroupSummarySchema } from './groupResponseSchemas';

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

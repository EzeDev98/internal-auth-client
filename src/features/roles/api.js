import { z } from 'zod';
import { bffGet, bffPost } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { roleSummarySchema, roleDetailSchema } from './roleResponseSchemas';

// Step 8A - proxied by the BFF (server/src/routes/roles.js), which forwards
// this using the session's own accessToken since PermissionController's
// GET /roles is an authenticated admin-only endpoint. Unlike listClients/
// listUsers, this returns the full role list unpaginated - RoleQueryServiceImpl
// backs it with a plain findAll(), no Pageable involved.
//
// Step 12A - both GET functions parse their response against
// roleResponseSchemas.js before returning it.
export function listRoles() {
  return bffGet('/roles').then((data) => parseResponse(z.array(roleSummarySchema), data));
}

// Step 8B
export function createRole(payload) {
  return bffPost('/roles', payload);
}

// Step 8C
export function getRole(id) {
  return bffGet(`/roles/${encodeURIComponent(id)}`).then((data) => parseResponse(roleDetailSchema, data));
}

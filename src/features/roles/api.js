// API calls for roles.
import { z } from 'zod';
import { bffGet, bffPost } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { roleSummarySchema, roleDetailSchema } from './roleResponseSchemas';

export function listRoles() {
  return bffGet('/roles').then((data) => parseResponse(z.array(roleSummarySchema), data));
}

export function createRole(payload) {
  return bffPost('/roles', payload);
}

export function getRole(id) {
  return bffGet(`/roles/${encodeURIComponent(id)}`).then((data) => parseResponse(roleDetailSchema, data));
}

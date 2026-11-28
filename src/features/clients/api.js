// API calls for client applications.
import { bffGet, bffPost, bffPatch } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { pagedClientsSchema, clientDetailSchema } from './clientResponseSchemas';

export function listClients({ page = 0, size = 20, enabled, type } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('size', size);
  if (enabled !== undefined && enabled !== null) params.set('enabled', enabled);
  if (type) params.set('type', type);
  return bffGet(`/clients?${params.toString()}`).then((data) => parseResponse(pagedClientsSchema, data));
}

export function createClient(payload) {
  return bffPost('/clients', payload);
}

export function getClient(clientId) {
  return bffGet(`/clients/${encodeURIComponent(clientId)}`).then((data) => parseResponse(clientDetailSchema, data));
}

export function updateClient(clientId, payload) {
  return bffPatch(`/clients/${encodeURIComponent(clientId)}`, payload);
}

export function rotateSecret(clientId) {
  return bffPost(`/clients/${encodeURIComponent(clientId)}/rotate-secret`, {});
}

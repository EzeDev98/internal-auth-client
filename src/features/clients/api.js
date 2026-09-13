import { bffGet, bffPost, bffPatch } from '../../shared/lib/bffClient';

// Step 6A/6B - proxied by the BFF (server/src/routes/clients.js), which
// forwards these using the session's own accessToken since
// ClientApplicationController is an authenticated admin-only endpoint, not
// a client-Basic-Auth or pre-auth one.
export function listClients({ page = 0, size = 20, enabled, type } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('size', size);
  if (enabled !== undefined && enabled !== null) params.set('enabled', enabled);
  if (type) params.set('type', type);
  return bffGet(`/clients?${params.toString()}`);
}

export function createClient(payload) {
  return bffPost('/clients', payload);
}

// Step 6C - clientId here is the OAuth2 client_id string, not the numeric
// id (see server/src/lib/authServerClient.js's comment on this).
export function getClient(clientId) {
  return bffGet(`/clients/${encodeURIComponent(clientId)}`);
}

export function updateClient(clientId, payload) {
  return bffPatch(`/clients/${encodeURIComponent(clientId)}`, payload);
}

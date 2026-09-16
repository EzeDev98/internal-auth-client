import { bffGet, bffPost, bffPatch } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { pagedClientsSchema, clientDetailSchema } from './clientResponseSchemas';

// Step 6A/6B - proxied by the BFF (server/src/routes/clients.js), which
// forwards these using the session's own accessToken since
// ClientApplicationController is an authenticated admin-only endpoint, not
// a client-Basic-Auth or pre-auth one.
//
// Step 12A - the two GET functions below (the ones useQuery actually calls
// as a queryFn) parse their response against clientResponseSchemas.js
// before handing it back, so a shape mismatch surfaces as this query's own
// isError/error instead of the page rendering undefined fields silently.
// Mutations (createClient/updateClient) aren't wrapped - Step 12A's own
// wording scopes this to "the query layer".
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

// Step 6C - clientId here is the OAuth2 client_id string, not the numeric
// id (see server/src/lib/authServerClient.js's comment on this).
export function getClient(clientId) {
  return bffGet(`/clients/${encodeURIComponent(clientId)}`).then((data) => parseResponse(clientDetailSchema, data));
}

export function updateClient(clientId, payload) {
  return bffPatch(`/clients/${encodeURIComponent(clientId)}`, payload);
}

// Settings tab "Regenerate secret" action - proxied POST
// /clients/{clientId}/rotate-secret (server/src/routes/clients.js).
export function rotateSecret(clientId) {
  return bffPost(`/clients/${encodeURIComponent(clientId)}/rotate-secret`, {});
}

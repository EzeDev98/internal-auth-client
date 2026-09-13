import { bffGet, bffDelete } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { pagedSessionsSchema } from './sessionResponseSchemas';

// Step 10A - proxied by the BFF (server/src/routes/sessions.js), which
// forwards this using the session's own accessToken since
// UserSessionController's GET /admin/sessions is an authenticated
// admin-only endpoint - same pattern as listRoles/listClients/listUsers.
//
// Step 12A - parses the response against sessionResponseSchemas.js before
// returning it.
export function listSessions({ ipAddress, device, active, page, size } = {}) {
  const params = new URLSearchParams();
  if (ipAddress) params.set('ipAddress', ipAddress);
  if (device) params.set('device', device);
  if (active !== undefined) params.set('active', active);
  if (page !== undefined) params.set('page', page);
  if (size !== undefined) params.set('size', size);
  const query = params.toString();
  return bffGet(`/sessions${query ? `?${query}` : ''}`).then((data) => parseResponse(pagedSessionsSchema, data));
}

// Step 10B - Revoke action. Proxied by the BFF's users router (Step 2H's
// DELETE /:username/sessions in server/src/routes/users.js), not the
// sessions router above - it forwards to UserSessionController's real
// endpoint, DELETE ${app.title}/users/{username}/sessions?clientId=...
// (the plan assumed "POST /session/invalidate", which doesn't exist).
// clientId comes from the row itself (Step 10B added it to
// AdminSessionSummaryResponse) since username alone can't resolve a
// unique account.
export function revokeSession({ username, clientId }) {
  const params = new URLSearchParams({ clientId: clientId ?? '' });
  return bffDelete(`/users/${encodeURIComponent(username)}/sessions?${params.toString()}`);
}

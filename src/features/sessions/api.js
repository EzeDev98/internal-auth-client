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

// Step 10C - "Revoke all sessions". UserSessionController has no bulk
// endpoint (only the single username+clientId DELETE Step 10B already
// uses), so this fetches every row that matches the caller's current
// filters (ipAddress/device, always forcing active=true regardless of
// what the caller passed in for `active`, since ending an already-ended
// session is meaningless) in one large page, de-dupes to unique
// {username, clientId} pairs skipping rows the single-revoke button would
// also have disabled (no clientId), and calls the same revokeSession
// above for each. Uses allSettled, not all, so one bad row can't stop the
// rest from being revoked - failures are returned, not thrown.
export async function revokeAllSessions({ ipAddress, device } = {}) {
  const { content: rows } = await listSessions({
    ipAddress, device, active: true, page: 0, size: 1000,
  });

  const seen = new Set();
  const targets = [];
  (rows ?? []).forEach((row) => {
    if (!row.active || !row.clientId) return;
    const key = `${row.username}::${row.clientId}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ username: row.username, clientId: row.clientId });
  });

  const results = await Promise.allSettled(targets.map((target) => revokeSession(target)));
  const failures = results
    .map((result, index) => (result.status === 'rejected' ? { ...targets[index], error: result.reason } : null))
    .filter(Boolean);

  return { attempted: targets.length, revoked: targets.length - failures.length, failures };
}

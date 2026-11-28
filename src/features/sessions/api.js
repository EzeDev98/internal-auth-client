// API calls for user sessions.
import { bffGet, bffDelete } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { pagedSessionsSchema } from './sessionResponseSchemas';

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

export function revokeSession({ username, clientId }) {
  const params = new URLSearchParams({ clientId: clientId ?? '' });
  return bffDelete(`/users/${encodeURIComponent(username)}/sessions?${params.toString()}`);
}

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

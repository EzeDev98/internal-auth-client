// Step 4F - talks to the BFF (server/), never to internal-auth-server
// directly. Session lives in an httpOnly cookie the browser can't read, so
// `credentials: 'include'` is required on every call; CSRF double-submit
// means every non-GET call must echo the readable `csrfToken` cookie back
// as a header (see server/src/middleware/csrf.js). No token, secret, or
// session id is ever read, stored, or handled here - only this cookie
// plumbing.
//
// In dev the BFF runs on its own port (see server/.env's PORT) while Vite
// serves the SPA on 5173, so VITE_BFF_BASE_URL points at it explicitly. In
// production the BFF serves the built SPA itself (same origin), so the
// env var is unset and requests fall back to a relative path.
const BFF_BASE_URL = `${import.meta.env.VITE_BFF_BASE_URL ?? ''}/bff`;

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (method !== 'GET') {
    const csrfToken = getCookie('csrfToken');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const res = await fetch(`${BFF_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed');
  }
  return payload.data;
}

export const bffGet = (path) => request(path);
export const bffPost = (path, body) => request(path, { method: 'POST', body });
export const bffDelete = (path) => request(path, { method: 'DELETE' });

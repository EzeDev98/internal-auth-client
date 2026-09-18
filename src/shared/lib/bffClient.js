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
const BFF_BASE_URL = `${import.meta.env.VITE_BFF_BASE_URL ?? \'\'}/bff`;

// Paths that must NEVER trigger the silent-refresh-then-retry dance below:
// /auth/login and /auth/login/verify-otp can legitimately 401 on wrong
// credentials - that\'s a form error to show inline, not a session expiry.
// /auth/refresh is the refresh call itself (recursion guard). /auth/me\'s
// 401 means the BFF\'s own session cookie is missing/invalid - requireSession
// never even reaches internal-auth-server for that route, so a refresh
// wouldn\'t help; RequireAuth (App.jsx) already sends that case to /login.
const AUTH_FLOW_PATHS = new Set([\'/auth/login\', \'/auth/login/verify-otp\', \'/auth/refresh\', \'/auth/me\']);

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function rawFetch(path, method, body) {
  const headers = { \'Content-Type\': \'application/json\' };
  if (method !== \'GET\') {
    const csrfToken = getCookie(\'csrfToken\');
    if (csrfToken) {
      headers[\'X-CSRF-Token\'] = csrfToken;
    }
  }

  const res = await fetch(`${BFF_BASE_URL}${path}`, {
    method,
    credentials: \'include\',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  return { res, payload };
}

// Access tokens the BFF forwards to internal-auth-server are short-lived
// (15 min, see app.authorization-server.access-token-ttl-minutes) while the
// BFF\'s own session cookie lives up to 24h - so a 401 partway through a
// session is normal and expected, not a real logout. This dedupes
// concurrent 401s (several queries can expire in the same instant) behind
// one POST /bff/auth/refresh call, matching the already-built server route
// in server/src/routes/auth.js that nothing was calling yet.
let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = rawFetch(\'/auth/refresh\', \'POST\').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Only a real, full session expiry (refresh token also invalid/expired)
// should ever land here - like Keycloak\'s own adapter, this is a hard
// redirect rather than an inline error banner, so the user is never left
// stranded on a page quietly failing every request.
function redirectToLogin() {
  window.location.assign(\'/login\');
}

async function request(path, { method = \'GET\', body } = {}) {
  let { res, payload } = await rawFetch(path, method, body);

  if (res.status === 401 && !AUTH_FLOW_PATHS.has(path)) {
    const { res: refreshRes } = await refreshSession();
    if (refreshRes.ok) {
      ({ res, payload } = await rawFetch(path, method, body));
    }
  }

  if (res.status === 401 && !AUTH_FLOW_PATHS.has(path)) {
    redirectToLogin();
    // Redirect is async; stop this call from resolving into a page that\'s
    // about to navigate away.
    return new Promise(() => {});
  }

  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message || \'Request failed\');
  }
  return payload.data;
}

export const bffGet = (path) => request(path);
export const bffPost = (path, body) => request(path, { method: \'POST\', body });
export const bffPatch = (path, body) => request(path, { method: \'PATCH\', body });
export const bffDelete = (path) => request(path, { method: \'DELETE\' });

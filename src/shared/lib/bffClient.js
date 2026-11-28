// HTTP client for calls to the BFF, with CSRF and session refresh handling.
const BFF_BASE_URL = `${import.meta.env.VITE_BFF_BASE_URL ?? ''}/bff`;

const AUTH_FLOW_PATHS = new Set(['/auth/login', '/auth/refresh', '/auth/me']);

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function rawFetch(path, method, body) {
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
  return { res, payload };
}

let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = rawFetch('/auth/refresh', 'POST').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function redirectToLogin() {
  window.location.assign('/login');
}

async function request(path, { method = 'GET', body } = {}) {
  let { res, payload } = await rawFetch(path, method, body);

  if (res.status === 401 && !AUTH_FLOW_PATHS.has(path)) {
    const { res: refreshRes } = await refreshSession();
    if (refreshRes.ok) {
      ({ res, payload } = await rawFetch(path, method, body));
    }
  }

  if (res.status === 401 && !AUTH_FLOW_PATHS.has(path)) {
    redirectToLogin();
    return new Promise(() => {});
  }

  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed');
  }
  return payload.data;
}

export const bffGet = (path) => request(path);
export const bffPost = (path, body) => request(path, { method: 'POST', body });
export const bffPatch = (path, body) => request(path, { method: 'PATCH', body });
export const bffDelete = (path) => request(path, { method: 'DELETE' });

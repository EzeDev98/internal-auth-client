const BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL;

// Register/forgot-password/reset-password call internal-auth-server
// directly (see each caller's own comment on why), so unlike bffClient.js's
// same-origin BFF_BASE_URL, an unset VITE_AUTH_API_BASE_URL has nowhere
// sane to fall back to. Failing loudly here beats silently sending every
// request to a literal ".../undefined/admin/register" 404.
if (!BASE_URL) {
  throw new Error(
    'VITE_AUTH_API_BASE_URL is not set - copy .env.example to .env.local and point it at internal-auth-server.',
  );
}

export async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed');
  }
  return payload.data;
}

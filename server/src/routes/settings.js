import { Router } from 'express';
import { listSigningKeys, rotateSigningKey, wipeAll } from '../lib/authServerClient.js';
import { requireSession } from '../middleware/requireSession.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

// Step 11A - Signing keys panel. GET, so no CSRF check, same pattern as
// every other list route (e.g. roles.js's GET /).
router.get('/signing-keys', requireSession, async (req, res) => {
  const upstream = await listSigningKeys(req.session.accessToken);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Step 11A - Rotate action, backed by the existing POST
// /admin/signing-keys/rotate (SigningKeyController#rotate). Mutates
// state, so verifyCsrf applies, same pattern as every other action route.
router.post('/signing-keys/rotate', requireSession, verifyCsrf, async (req, res) => {
  const upstream = await rotateSigningKey(req.session.accessToken);
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

// Settings - Danger zone. New POST /admin/reset/wipe-all
// (TenantResetController#wipeAll). requireSession + verifyCsrf are the
// human-facing gate here (must be a logged-in admin, real browser
// request) - the actual authorization upstream is the shared secret
// authServerClient.wipeAll() attaches server-side (see its own comment),
// never anything read off the request. confirmation is still forwarded
// from the body rather than hardcoded here, so the upstream
// confirmation-phrase check (TenantResetAuthorizer#authorizeWipeAll)
// stays the real gate against firing by accident.
router.post('/wipe-all', requireSession, verifyCsrf, async (req, res) => {
  const { confirmation, includeSystemWallet } = req.body ?? {};
  const upstream = await wipeAll(confirmation, Boolean(includeSystemWallet));
  const body = upstream.data;

  if (upstream.status >= 400 || !body?.success) {
    return res.status(upstream.status).json(body);
  }
  return res.json({ success: true, message: body.message, data: body.data });
});

export default router;

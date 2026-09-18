import { bffGet, bffPost } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { signingKeyListSchema } from './signingKeyResponseSchemas';
import { wipeAllResponseSchema } from './wipeAllResponseSchemas';

// Step 11A - Signing keys panel, backed by the new GET
// ${app.title}/admin/signing-keys (SigningKeyController#list) - added
// alongside this screen since nothing upstream exposed the current
// key/history the plan's "current key + rotate action" panel needs.
//
// Step 12A - parses the response against signingKeyResponseSchemas.js
// before returning it.
export function listSigningKeys() {
  return bffGet('/settings/signing-keys').then((data) => parseResponse(signingKeyListSchema, data));
}

// Step 11A - Rotate action, backed by the existing POST
// /admin/signing-keys/rotate (SigningKeyController#rotate).
export function rotateSigningKey() {
  return bffPost('/settings/signing-keys/rotate');
}

// Settings - Danger zone. New POST /settings/wipe-all, backed by the
// upstream POST /admin/reset/wipe-all (TenantResetController#wipeAll) -
// wipes SyncPoint, Notare, and internal-auth together. Parsed against
// wipeAllResponseSchemas.js before returning, same as listSigningKeys
// above, so the Danger zone panel can trust `steps`/`completedFully` are
// really there.
export function wipeAll(confirmation, includeSystemWallet) {
  return bffPost('/settings/wipe-all', { confirmation, includeSystemWallet })
    .then((data) => parseResponse(wipeAllResponseSchema, data));
}

import { bffGet, bffPost } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { signingKeyListSchema } from './signingKeyResponseSchemas';

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

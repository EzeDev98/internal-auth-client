// API calls for signing keys and the full data wipe.
import { bffGet, bffPost } from '../../shared/lib/bffClient';
import { parseResponse } from '../../shared/lib/parseResponse';
import { signingKeyListSchema } from './signingKeyResponseSchemas';
import { wipeAllResponseSchema } from './wipeAllResponseSchemas';

export function listSigningKeys() {
  return bffGet('/settings/signing-keys').then((data) => parseResponse(signingKeyListSchema, data));
}

export function rotateSigningKey() {
  return bffPost('/settings/signing-keys/rotate');
}

export function wipeAll(confirmation, includeSystemWallet) {
  return bffPost('/settings/wipe-all', { confirmation, includeSystemWallet })
    .then((data) => parseResponse(wipeAllResponseSchema, data));
}

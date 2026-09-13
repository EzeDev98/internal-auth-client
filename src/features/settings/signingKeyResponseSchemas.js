import { z } from 'zod';

// Step 12A - mirrors SigningKeyResponse (Step 14D on the server, reused
// as-is for Step 11A's GET /admin/signing-keys list). status is a plain
// string (SigningKeyStatus's JSON form: "ACTIVE"/"RETIRED"), not a closed
// enum here, same reasoning as clientResponseSchemas.js's `type`.
export const signingKeySchema = z
  .object({
    kid: z.string(),
    status: z.string(),
    current: z.boolean(),
    createdAt: z.string(),
  })
  .passthrough();

export const signingKeyListSchema = z.array(signingKeySchema);

// Response schemas for signing key endpoints.
import { z } from 'zod';

export const signingKeySchema = z
  .object({
    kid: z.string(),
    status: z.string(),
    current: z.boolean(),
    createdAt: z.string(),
    retiredAt: z.string().nullable(),
  })
  .passthrough();

export const signingKeyListSchema = z.array(signingKeySchema);

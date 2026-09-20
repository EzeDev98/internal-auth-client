import { z } from 'zod';
import { refreshTokenFields, validateRefreshTokenFields } from './refreshTokenSettings';

// Matches UpdateClientApplicationRequest - the secret is deliberately not editable here.
// grantTypes is editable; the server enforces the rules (at least one, and refresh_token
// can't be removed while persistent refresh tokens are on).
export const updateClientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  redirectUris: z.string().trim().optional(),
  scopes: z.string().trim().optional(),
  enabled: z.boolean(),
  grantTypes: z.array(z.string()).min(1, 'Select at least one authentication flow'),
  ...refreshTokenFields,
}).superRefine(validateRefreshTokenFields);

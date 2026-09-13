import { z } from 'zod';

// Matches UpdateClientApplicationRequest - grantTypes and the secret are
// deliberately not editable here (see that DTO's own Javadoc).
export const updateClientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  redirectUris: z.string().trim().optional(),
  scopes: z.string().trim().optional(),
  enabled: z.boolean(),
});

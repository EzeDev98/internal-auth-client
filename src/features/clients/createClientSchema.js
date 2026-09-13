import { z } from 'zod';

// Matches CreateClientApplicationRequest: only clientId and name are
// required server-side (ClientApplicationServiceImpl#createClient).
export const createClientSchema = z.object({
  clientId: z.string().trim().min(1, 'Client ID is required'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  redirectUris: z.string().trim().optional(),
  scopes: z.string().trim().optional(),
  grantTypes: z.array(z.string()).optional(),
});

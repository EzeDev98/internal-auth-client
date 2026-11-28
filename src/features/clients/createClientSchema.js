// Validation schema for creating a client application.
import { z } from 'zod';
import { refreshTokenFields, validateRefreshTokenFields } from './refreshTokenSettings';

export const createClientSchema = z.object({
  clientId: z.string().trim().min(1, 'Client ID is required'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  redirectUris: z.string().trim().optional(),
  scopes: z.string().trim().optional(),
  grantTypes: z.array(z.string()).optional(),
  ...refreshTokenFields,
}).superRefine(validateRefreshTokenFields);

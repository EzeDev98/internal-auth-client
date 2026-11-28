// Validation schema for updating a user.
import { z } from 'zod';

export const updateUserSchema = z.object({
  enabled: z.boolean(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
});

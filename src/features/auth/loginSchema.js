// Validation schema for the login form.
import { z } from 'zod';

export const credentialsSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

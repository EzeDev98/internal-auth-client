// Validation schema for creating a role.
import { z } from 'zod';

export const createRoleSchema = z.object({
  roleName: z.string().trim().min(1, 'Role name is required'),
  description: z.string().trim().optional(),
});

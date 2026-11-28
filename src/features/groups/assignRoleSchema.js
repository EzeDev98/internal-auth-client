// Validation schema for assigning a role to a group.
import { z } from 'zod';

export const assignRoleSchema = z.object({
  roleName: z.string().trim().min(1, 'Select a role'),
});

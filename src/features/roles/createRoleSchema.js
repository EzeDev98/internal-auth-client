import { z } from 'zod';

// Matches RolesRequest: only roleName is required server-side
// (PermissionManagementService#createRole takes roleName + description,
// description is optional).
export const createRoleSchema = z.object({
  roleName: z.string().trim().min(1, 'Role name is required'),
  description: z.string().trim().optional(),
});

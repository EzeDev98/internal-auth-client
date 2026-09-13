import { z } from 'zod';

// Matches AssignRoleToGroupRequest/AssignRoleToSubGroupRequest: roleName
// is the only field either endpoint takes.
export const assignRoleSchema = z.object({
  roleName: z.string().trim().min(1, 'Select a role'),
});

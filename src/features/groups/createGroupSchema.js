import { z } from 'zod';

// Matches GroupRequest/SubGroupRequest: only groupName is required
// server-side (PermissionManagementService#createSuperGroup/createSubGroup
// take groupName + description, description is optional). The same shape
// is reused for both a top-level group and a subgroup - the only
// difference is which endpoint CreateGroupModal posts to.
export const createGroupSchema = z.object({
  groupName: z.string().trim().min(1, 'Group name is required'),
  description: z.string().trim().optional(),
});

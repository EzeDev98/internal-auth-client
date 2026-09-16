import { z } from 'zod';

// Same shape as createGroupSchema's groupName field - only a new name is
// collected, matching whatever the eventual PATCH /groups/{parentGroupName}
// /subgroups/{subGroupName} request body ends up requiring (see the
// TODO(backend) note in api.js).
export const renameGroupSchema = z.object({
  groupName: z.string().trim().min(1, 'Group name is required'),
});

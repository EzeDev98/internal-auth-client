// Validation schema for renaming a group.
import { z } from 'zod';

export const renameGroupSchema = z.object({
  groupName: z.string().trim().min(1, 'Group name is required'),
});

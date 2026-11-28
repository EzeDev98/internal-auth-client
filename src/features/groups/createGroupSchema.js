// Validation schema for creating a group.
import { z } from 'zod';

export const createGroupSchema = z.object({
  groupName: z.string().trim().min(1, 'Group name is required'),
  description: z.string().trim().optional(),
});

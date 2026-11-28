// Validation schema for the join group picker.
import { z } from 'zod';

export const joinGroupSchema = z.object({
  groupName: z.string().trim().min(1, 'Select a group'),
});

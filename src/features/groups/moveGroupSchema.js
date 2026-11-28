// Validation schema for moving a sub-group.
import { z } from 'zod';

export const moveGroupSchema = z.object({
  destinationGroupName: z.string().trim().min(1, 'Select a destination group'),
});

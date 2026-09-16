import { z } from 'zod';

// Destination is picked from the existing top-level groups list (see
// MoveGroupModal's use of listGroups), so this only needs to guard against
// submitting with nothing selected.
export const moveGroupSchema = z.object({
  destinationGroupName: z.string().trim().min(1, 'Select a destination group'),
});

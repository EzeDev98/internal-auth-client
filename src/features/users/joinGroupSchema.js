import { z } from 'zod';

// Client-side validation for JoinGroupModal's group picker only - the
// actual request body sent to POST /groups/{groupName}/users is
// { username }, matching AddGroupMemberRequest; groupName here is a path
// segment, not a body field.
export const joinGroupSchema = z.object({
  groupName: z.string().trim().min(1, 'Select a group'),
});

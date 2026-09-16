import { z } from 'zod';

// Matches AdminUpdateUserRequest - enabled/emailVerified/phoneVerified are
// the only fields the Overview tab can edit (username/email/phone aren't
// patchable - see that DTO's own Javadoc). All three are always sent
// (never null/omitted) since the form always has a current value for each.
export const updateUserSchema = z.object({
  enabled: z.boolean(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
});

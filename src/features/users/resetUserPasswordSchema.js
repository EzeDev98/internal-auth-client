import { z } from 'zod';

// Step 2H - Users - Detail Credentials tab "Reset password" modal. Mirrors
// AdminResetPasswordRequest's server-side validation
// (ResetValidator#validateNewPassword, reused directly by
// AdminUserServiceImpl#resetPassword) - same shape as resetPasswordSchema.js's
// self-service equivalent.
export const resetUserPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

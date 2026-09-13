import { z } from 'zod';

export const credentialsSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// The BFF's /admin/login/verify-otp mirrors internal-auth-server's own
// VerifyLoginOtpRequest shape (phoneNumber + otp) - login's response never
// returns the phone number back to us, so the user re-enters it here.
export const otpSchema = z.object({
  phoneNumber: z.string().trim().regex(/^\+?[0-9]{11}$/, 'Enter a valid phone number'),
  otp: z.string().trim().min(4, 'Enter the verification code you were sent'),
});

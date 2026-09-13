import { z } from 'zod';

export const phoneSchema = z.object({
  phoneNumber: z.string().trim().regex(/^\+?[0-9]{11}$/, 'Enter a valid phone number'),
});

export const otpOnlySchema = z.object({
  otp: z.string().trim().min(4, 'Enter the verification code you were sent'),
});

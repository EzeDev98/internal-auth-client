// Validation schema for the registration form.
import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters'),
    phoneNumber: z.string().trim().regex(/^\+?[0-9]{11}$/, 'Enter a valid phone number').or(z.literal('')),
    email: z.string().trim().email('Enter a valid email').or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.phoneNumber || data.email, {
    message: 'Provide a phone number or an email',
    path: ['email'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

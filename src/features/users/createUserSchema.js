import { z } from 'zod';

// Mirrors AdminCreateUserRequest's server-side validation
// (RegistrationValidator's username/phone/email rules, plus
// ResetValidator#validateNewPassword's password rule, which
// AdminUserServiceImpl#createUser reuses directly) - same shape as
// registerSchema.js, plus the clientId a user is always scoped to.
export const createUserSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Client application is required'),
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

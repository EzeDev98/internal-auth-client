// Response schemas for user endpoints.
import { z } from 'zod';
import { pagedSchema } from '../../shared/lib/pagedSchema';

export const userSummarySchema = z
  .object({
    id: z.number(),
    username: z.string(),
    phoneNumber: z.string().nullable(),
    email: z.string().nullable(),
    enabled: z.boolean(),
    createdAt: z.string(),
    clientId: z.string().nullable(),
  })
  .passthrough();

export const pagedUsersSchema = pagedSchema(userSummarySchema);

export const userProfileSchema = z
  .object({
    id: z.number(),
    username: z.string(),
    phoneNumber: z.string().nullable(),
    email: z.string().nullable(),
    enabled: z.boolean(),
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
    createdAt: z.string(),
  })
  .passthrough();

export const userRoleSchema = z
  .object({
    statusCode: z.number().optional(),
    roleId: z.number(),
    roleName: z.string(),
    description: z.string().nullable(),
  })
  .passthrough();

export const userPermissionGroupSchema = z
  .object({
    groupId: z.number(),
    groupName: z.string(),
    description: z.string().nullable(),
  })
  .passthrough();

export const userCredentialSchema = z
  .object({
    type: z.string(),
    createdAt: z.string(),
  })
  .passthrough();

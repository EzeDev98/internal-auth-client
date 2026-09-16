import { z } from 'zod';

export const groupSummarySchema = z
  .object({
    id: z.number(),
    groupName: z.string(),
    description: z.string().nullable(),
    clientApplicationId: z.number().nullable(),
    createdAt: z.string(),
  })
  .passthrough();

export const subGroupSummarySchema = z
  .object({
    id: z.number(),
    groupName: z.string(),
    description: z.string().nullable(),
    parentGroupId: z.number().nullable(),
    createdAt: z.string(),
  })
  .passthrough();

export const groupUserSchema = z
  .object({
    userId: z.number(),
    username: z.string().nullable(),
    email: z.string().nullable(),
    // Every group/subgroup path this user belongs to, system-wide,
    // comma-joined by the backend (DtoMapper#buildMembershipPaths) -
    // matches Keycloak's own Members tab "Membership" column.
    membership: z.string().nullable(),
  })
  .passthrough();

export const groupRoleSchema = z
  .object({
    id: z.number(),
    roleName: z.string(),
    description: z.string().nullable(),
  })
  .passthrough();

export const groupDetailSchema = z
  .object({
    groupId: z.number(),
    groupName: z.string(),
    description: z.string().nullable(),
    userResponses: z.array(groupUserSchema),
    roles: z.array(groupRoleSchema),
  })
  .passthrough();

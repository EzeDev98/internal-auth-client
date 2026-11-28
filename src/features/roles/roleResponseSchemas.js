// Response schemas for role endpoints.
import { z } from 'zod';

export const roleSummarySchema = z
  .object({
    id: z.number(),
    roleName: z.string(),
    description: z.string().nullable(),
    clientApplicationId: z.number().nullable(),
    createdAt: z.string(),
  })
  .passthrough();

const rolePermissionSchema = z
  .object({
    id: z.number(),
    permissionName: z.string(),
    description: z.string().nullable(),
  })
  .passthrough();

const roleUserSchema = z
  .object({
    id: z.number(),
    username: z.string(),
    email: z.string().nullable(),
  })
  .passthrough();

export const roleDetailSchema = z
  .object({
    id: z.number(),
    roleName: z.string(),
    description: z.string().nullable(),
    clientApplicationId: z.number().nullable(),
    createdAt: z.string(),
    permissions: z.array(rolePermissionSchema).nullable(),
    permissionGroups: z.array(z.string()).nullable(),
    usersInRole: z.array(roleUserSchema).nullable(),
  })
  .passthrough();

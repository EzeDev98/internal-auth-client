import { z } from 'zod';

// Step 12A - mirrors RoleSummaryResponse (Step 2C). clientApplicationId is
// null for a global role - see Role's own class Javadoc - RolesListPage's
// Scope badge already branches on that.
export const roleSummarySchema = z
  .object({
    id: z.number(),
    roleName: z.string(),
    description: z.string().nullable(),
    clientApplicationId: z.number().nullable(),
    createdAt: z.string(),
  })
  .passthrough();

// Step 12A - mirrors RolePermissionSummary - always an empty list today
// per that DTO's own Javadoc, but the shape is still validated for when
// that changes.
const rolePermissionSchema = z
  .object({
    id: z.number(),
    permissionName: z.string(),
    description: z.string().nullable(),
  })
  .passthrough();

// Step 12A - mirrors RoleUserSummary.
const roleUserSchema = z
  .object({
    id: z.number(),
    username: z.string(),
    email: z.string().nullable(),
  })
  .passthrough();

// Step 12A - mirrors RoleDetailResponse (Step 2C). permissions/
// permissionGroups/usersInRole are three separate lists on the real DTO
// (see RoleQueryServiceImpl's own Javadoc on why) - nullable here since
// RoleDetailPage already falls back with `?? []` on each.
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

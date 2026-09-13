import { z } from 'zod';
import { pagedSchema } from '../../shared/lib/pagedSchema';

// Step 12A - mirrors UserSummaryResponse (Step 2A, clientId added Step 7A).
// clientId is nullable here even though the server treats it as best-effort
// (AdminUserServiceImpl#resolveClientId can return null for an orphaned
// row) - UsersListPage already handles that via its detail link's `?? ''`.
export const userSummarySchema = z
  .object({
    id: z.number(),
    username: z.string(),
    phoneNumber: z.string().nullable(),
    email: z.string().nullable(),
    enabled: z.boolean(),
    mfaEnabled: z.boolean(),
    createdAt: z.string(),
    clientId: z.string().nullable(),
  })
  .passthrough();

export const pagedUsersSchema = pagedSchema(userSummarySchema);

// Step 12A - mirrors UserProfileResponse (Step 2A).
export const userProfileSchema = z
  .object({
    id: z.number(),
    username: z.string(),
    phoneNumber: z.string().nullable(),
    email: z.string().nullable(),
    enabled: z.boolean(),
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
    mfaEnabled: z.boolean(),
    createdAt: z.string(),
  })
  .passthrough();

// Step 12A - mirrors RoleResponse, what GET /users/{username}/roles
// returns per row (PermissionController#fetchUserRoles) - same DTO the
// plan's Step 2's "Already built" role-assign endpoints use, just reused
// here as a read shape. statusCode is per-item on this DTO but unused by
// RolesTab; kept optional rather than required since nothing here depends
// on it being present.
export const userRoleSchema = z
  .object({
    statusCode: z.number().optional(),
    roleId: z.number(),
    roleName: z.string(),
    description: z.string().nullable(),
  })
  .passthrough();

// Step 12A - mirrors PermissionGroupResponse, what
// GET /users/{username}/permission-groups returns per row
// (PermissionController#fetchUserPermissionGroups).
export const userPermissionGroupSchema = z
  .object({
    groupId: z.number(),
    groupName: z.string(),
    description: z.string().nullable(),
  })
  .passthrough();

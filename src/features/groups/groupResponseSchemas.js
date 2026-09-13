import { z } from 'zod';

// Step 12A - mirrors GroupSummaryResponse, what GET /groups returns per
// row (PermissionController#listGroups, Step 2D) - not GroupResponse,
// which is a different DTO for a different endpoint (GET
// /groups/{groupName}).
export const groupSummarySchema = z
  .object({
    id: z.number(),
    groupName: z.string(),
    description: z.string().nullable(),
    clientApplicationId: z.number().nullable(),
    createdAt: z.string(),
  })
  .passthrough();

// Step 12A - mirrors SubGroupSummaryResponse, what
// GET /groups/{id}/subgroups returns per row
// (PermissionController#listSubgroups, Step 2D) - not SubGroupResponse
// (a different endpoint's DTO, and a different field shape:
// subGroupId/subgroupName vs this one's id/groupName).
export const subGroupSummarySchema = z
  .object({
    id: z.number(),
    groupName: z.string(),
    description: z.string().nullable(),
    parentGroupId: z.number().nullable(),
    createdAt: z.string(),
  })
  .passthrough();

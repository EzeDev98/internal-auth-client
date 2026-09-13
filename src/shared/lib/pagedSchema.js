import { z } from 'zod';

// Step 12A - every paginated list endpoint in this app hand-rolls the same
// envelope (see PagedUsersResponse/PagedAdminSessionsResponse/
// PagedClientApplicationsResponse on the server - each one's own Javadoc
// says "same hand-rolled shape as PagedUsersResponse"), so one factory
// covers content/page/size/totalElements/totalPages for all of them.
export function pagedSchema(itemSchema) {
  return z
    .object({
      content: z.array(itemSchema),
      page: z.number(),
      size: z.number(),
      totalElements: z.number(),
      totalPages: z.number(),
    })
    .passthrough();
}

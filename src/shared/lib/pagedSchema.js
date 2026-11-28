// Builds response schemas for paged list endpoints.
import { z } from 'zod';

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

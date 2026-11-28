// Response schemas for session endpoints.
import { z } from 'zod';
import { pagedSchema } from '../../shared/lib/pagedSchema';

export const sessionSchema = z
  .object({
    id: z.number(),
    userId: z.number(),
    username: z.string().nullable(),
    ipAddress: z.string().nullable(),
    device: z.string().nullable(),
    active: z.boolean(),
    createdAt: z.string().nullable(),
    endedAt: z.string().nullable(),
    endReason: z.string().nullable(),
    clientId: z.string().nullable(),
  })
  .passthrough();

export const pagedSessionsSchema = pagedSchema(sessionSchema);

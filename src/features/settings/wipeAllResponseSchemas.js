// Response schema for the full data wipe.
import { z } from 'zod';

const wipeAllStepSchema = z
  .object({
    service: z.string(),
    success: z.boolean(),
    message: z.string().nullable(),
    deletedCounts: z.record(z.string(), z.number()).nullable(),
  })
  .passthrough();

export const wipeAllResponseSchema = z
  .object({
    completedFully: z.boolean(),
    steps: z.array(wipeAllStepSchema),
  })
  .passthrough();

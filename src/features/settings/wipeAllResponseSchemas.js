import { z } from 'zod';

// Settings - Danger zone. Mirrors WipeAllResponse (WipeAllService on the
// server): each step names which service ran ("sync-point", "notare", or
// "notare-internal-auth-tenant"), whether it succeeded, a message, and
// optional per-entity deleted counts. completedFully is only true when
// every step succeeded - the wipe stops at the first failure (see
// WipeAllService's own class Javadoc), so a false here means whatever
// step reported success=false is where it stopped and later steps were
// never attempted.
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

import { z } from 'zod';
import { pagedSchema } from '../../shared/lib/pagedSchema';

// Step 12A - mirrors AdminSessionSummaryResponse (Step 2E, clientId added
// Step 10B). ipAddress/device/clientId are all nullable - ipAddress/device
// are absent on any session row created before Step 2E (see UserSession's
// own class Javadoc), and clientId is a best-effort resolution
// (SessionManagementServiceImpl#resolveClientId can return null) that
// SessionsListPage's Revoke action already treats as possibly missing.
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

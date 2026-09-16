import { z } from 'zod';
import { pagedSchema } from '../../shared/lib/pagedSchema';

// Step 12A - mirrors ClientApplicationSummaryResponse (Step 2B) field for
// field. type is a plain string here (ClientType's JSON form), not a
// closed enum - a server adding a new client type shouldn't make this
// schema start rejecting otherwise-valid rows.
export const clientSummarySchema = z
  .object({
    id: z.number(),
    clientId: z.string(),
    name: z.string(),
    type: z.string(),
    enabled: z.boolean(),
    createdAt: z.string(),
  })
  .passthrough();

export const pagedClientsSchema = pagedSchema(clientSummarySchema);

// Step 12A - mirrors ClientApplicationDetailResponse (Step 2B).
// clientSecret is the decrypted, viewable secret for a CONFIDENTIAL
// client that was created or regenerated after the server started
// storing it reversibly - null for PUBLIC clients and for any older
// CONFIDENTIAL client that predates that (those still need a regenerate
// to get a viewable secret).
export const clientDetailSchema = z
  .object({
    id: z.number(),
    clientId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    redirectUris: z.array(z.string()).nullable(),
    scopes: z.array(z.string()).nullable(),
    grantTypes: z.array(z.string()).nullable(),
    type: z.string(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
    clientSecret: z.string().nullable().optional(),
  })
  .passthrough();

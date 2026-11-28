// Response schemas for client application endpoints.
import { z } from 'zod';
import { pagedSchema } from '../../shared/lib/pagedSchema';

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
    refreshTokenRotationEnabled: z.boolean().optional(),
    refreshTokenTtlDays: z.number().nullable().optional(),
    refreshTokenMaxLifetimeDays: z.number().nullable().optional(),
  })
  .passthrough();

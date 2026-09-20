import { z } from 'zod';

// Shared by createClientSchema.js, updateClientSchema.js and
// RefreshTokenSettingsFields.jsx. The bounds mirror
// ClientApplicationServiceImpl#applyRefreshTokenSettings on the server.
export const MIN_REFRESH_TOKEN_TTL_DAYS = 1;
export const MAX_REFRESH_TOKEN_TTL_DAYS = 365;
export const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 60;
export const MAX_SESSION_LIFETIME_DAYS = 3650;

// Spread into each form's z.object({...}). refreshTokenTtlDays stays a
// string because it comes straight from a text/number input.
export const refreshTokenFields = {
  persistentRefreshToken: z.boolean().optional(),
  refreshTokenTtlDays: z.string().trim().optional(),
  refreshTokenMaxLifetimeDays: z.string().trim().optional(),
  // Independent of persistentRefreshToken - matters for rotating clients too,
  // since revokePriorAuthorizations runs on every new login regardless.
  revokePriorSessionsOnLogin: z.boolean().optional(),
};

// Pass to .superRefine() on each form schema. grantTypes only exists on the
// create form; the edit form leaves that check to the server.
export function validateRefreshTokenFields(values, ctx) {
  if (!values.persistentRefreshToken) return;

  const raw = values.refreshTokenTtlDays ?? '';
  const days = Number(raw);
  if (raw === '' || !Number.isInteger(days) || days < MIN_REFRESH_TOKEN_TTL_DAYS || days > MAX_REFRESH_TOKEN_TTL_DAYS) {
    ctx.addIssue({
      code: 'custom',
      path: ['refreshTokenTtlDays'],
      message: `Enter a whole number of days between ${MIN_REFRESH_TOKEN_TTL_DAYS} and ${MAX_REFRESH_TOKEN_TTL_DAYS}`,
    });
  }

  // Optional: blank means no cap. When set it must be a whole number >= the lifetime above.
  const rawMax = values.refreshTokenMaxLifetimeDays ?? '';
  if (rawMax !== '') {
    const maxDays = Number(rawMax);
    const minAllowed = Number.isInteger(days) && days >= MIN_REFRESH_TOKEN_TTL_DAYS ? days : MIN_REFRESH_TOKEN_TTL_DAYS;
    if (!Number.isInteger(maxDays) || maxDays < minAllowed || maxDays > MAX_SESSION_LIFETIME_DAYS) {
      ctx.addIssue({
        code: 'custom',
        path: ['refreshTokenMaxLifetimeDays'],
        message: `Leave blank for no cap, or enter a whole number of days between ${minAllowed} and ${MAX_SESSION_LIFETIME_DAYS}`,
      });
    }
  }

  if (Array.isArray(values.grantTypes) && !values.grantTypes.includes('refresh_token')) {
    ctx.addIssue({
      code: 'custom',
      path: ['persistentRefreshToken'],
      message: 'Enable the "Refresh token" grant type first - persistent refresh tokens need it.',
    });
  }
}

// Fields to spread into the create/update request body.
export function buildRefreshTokenPayload(values) {
  return {
    ...(values.persistentRefreshToken
      ? {
        refreshTokenRotationEnabled: false,
        refreshTokenTtlDays: Number(values.refreshTokenTtlDays),
        // null (not omitted) so editing a client can remove an existing cap.
        refreshTokenMaxLifetimeDays: values.refreshTokenMaxLifetimeDays ? Number(values.refreshTokenMaxLifetimeDays) : null,
      }
      : { refreshTokenRotationEnabled: true }),
    // Default true server-side too if omitted, but send explicitly since the
    // form always has a defined value (defaultValues on create, reset() on edit).
    revokePriorSessionsOnLogin: values.revokePriorSessionsOnLogin ?? true,
  };
}

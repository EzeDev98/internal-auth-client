// Shared validation and defaults for refresh token settings.
import { z } from 'zod';

export const MIN_REFRESH_TOKEN_TTL_DAYS = 1;
export const MAX_REFRESH_TOKEN_TTL_DAYS = 365;
export const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 60;
export const MAX_SESSION_LIFETIME_DAYS = 3650;

export const refreshTokenFields = {
  persistentRefreshToken: z.boolean().optional(),
  refreshTokenTtlDays: z.string().trim().optional(),
  refreshTokenMaxLifetimeDays: z.string().trim().optional(),
  revokePriorSessionsOnLogin: z.boolean().optional(),
};

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

export function buildRefreshTokenPayload(values) {
  return {
    ...(values.persistentRefreshToken
      ? {
        refreshTokenRotationEnabled: false,
        refreshTokenTtlDays: Number(values.refreshTokenTtlDays),
        refreshTokenMaxLifetimeDays: values.refreshTokenMaxLifetimeDays ? Number(values.refreshTokenMaxLifetimeDays) : null,
      }
      : { refreshTokenRotationEnabled: true }),
    revokePriorSessionsOnLogin: values.revokePriorSessionsOnLogin ?? true,
  };
}

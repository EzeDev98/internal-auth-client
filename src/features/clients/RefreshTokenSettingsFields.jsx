// Shared refresh token and session settings fields for client forms.
import { Controller } from 'react-hook-form';
import {
  FormGroup, Switch, TextInput, Alert, FormHelperText, HelperText, HelperTextItem,
} from '@patternfly/react-core';
import { MIN_REFRESH_TOKEN_TTL_DAYS, MAX_REFRESH_TOKEN_TTL_DAYS, MAX_SESSION_LIFETIME_DAYS } from './refreshTokenSettings';

export default function RefreshTokenSettingsFields({
  control, register, errors, isPersistent, isDisabled = false, disabledReason,
}) {
  const toggleError = errors.persistentRefreshToken?.message;
  const ttlError = errors.refreshTokenTtlDays?.message;
  const maxLifetimeError = errors.refreshTokenMaxLifetimeDays?.message;

  return (
    <>
      <FormGroup label="Persistent refresh token" fieldId="persistentRefreshToken">
        <Controller
          name="persistentRefreshToken"
          control={control}
          render={({ field }) => (
            <Switch
              id="persistentRefreshToken"
              label="On"
              labelOff="Off"
              isChecked={field.value ?? false}
              isDisabled={isDisabled}
              onChange={(_event, checked) => field.onChange(checked)}
            />
          )}
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant={toggleError ? 'error' : 'default'}>
              {toggleError
                ?? (isDisabled ? disabledReason : null)
                ?? 'Off (default): strict single-use rotation. On: the refresh token is not single-use - it keeps the same value and its expiry slides forward each time it is used, so users stay signed in through long offline periods.'}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup label="Revoke other sessions on new login" fieldId="revokePriorSessionsOnLogin">
        <Controller
          name="revokePriorSessionsOnLogin"
          control={control}
          render={({ field }) => (
            <Switch
              id="revokePriorSessionsOnLogin"
              label="On"
              labelOff="Off"
              isChecked={field.value ?? true}
              onChange={(_event, checked) => field.onChange(checked)}
            />
          )}
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              On (default): a new login immediately revokes every other device's session for this user on this client.
              Off: multiple devices can stay signed in for the same user at once - turn this off for clients like an
              offline payment terminal, where a second device (or a reconnecting first device) logging in must never
              sign another device out.
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      {isPersistent && (
        <>
          <FormGroup label="Refresh token lifetime (days)" isRequired fieldId="refreshTokenTtlDays">
            <TextInput
              id="refreshTokenTtlDays"
              type="number"
              inputMode="numeric"
              min={MIN_REFRESH_TOKEN_TTL_DAYS}
              max={MAX_REFRESH_TOKEN_TTL_DAYS}
              {...register('refreshTokenTtlDays')}
              validated={ttlError ? 'error' : 'default'}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={ttlError ? 'error' : 'default'}>
                  {ttlError ?? 'How long a device can stay unused before its refresh token expires. Restarts every time the token is used.'}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Maximum session lifetime (days)" fieldId="refreshTokenMaxLifetimeDays">
            <TextInput
              id="refreshTokenMaxLifetimeDays"
              type="number"
              inputMode="numeric"
              min={MIN_REFRESH_TOKEN_TTL_DAYS}
              max={MAX_SESSION_LIFETIME_DAYS}
              placeholder="No cap"
              {...register('refreshTokenMaxLifetimeDays')}
              validated={maxLifetimeError ? 'error' : 'default'}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={maxLifetimeError ? 'error' : 'default'}>
                  {maxLifetimeError ?? 'Optional hard limit, counted from login no matter how often the token is used. Blank = no cap, so an actively used token never expires. Lowering it signs out any device already past the new limit the next time it connects.'}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <Alert
            variant="warning"
            isInline
            isPlain
            title="A persistent refresh token that is stolen stays usable until it expires or is revoked, so keep the lifetime as short as your offline use case allows."
          />
        </>
      )}
    </>
  );
}

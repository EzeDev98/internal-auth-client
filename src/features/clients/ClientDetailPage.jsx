// Client application detail screen with settings and credentials.
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Form, FormGroup, TextInput, TextArea, Checkbox, Switch, Alert, Tooltip,
  FormHelperText, HelperText, HelperTextItem,
  InputGroup, InputGroupItem,
} from '@patternfly/react-core';
import {
  EyeIcon, EyeSlashIcon, CopyIcon, SyncAltIcon,
} from '@patternfly/react-icons';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import QueryState from '../../shared/components/QueryState';
import Button from '../../shared/components/Button';
import Tabs from '../../shared/components/Tabs';
import Modal from '../../shared/components/Modal';
import { useToast } from '../../shared/lib/useToast';
import { getClient, updateClient, rotateSecret } from './api';
import { updateClientSchema } from './updateClientSchema';
import RefreshTokenSettingsFields from './RefreshTokenSettingsFields';
import { buildRefreshTokenPayload } from './refreshTokenSettings';
import styles from './ClientDetailPage.module.css';

const GRANT_TYPE_OPTIONS = [
  { value: 'authorization_code', label: 'Authorization code', help: 'Lets this client obtain tokens via the OAuth 2.0 authorization code flow.' },
  { value: 'refresh_token', label: 'Refresh token', help: 'Lets this client request a refresh token alongside its access token.' },
  { value: 'client_credentials', label: 'Client credentials', help: 'Lets this client authenticate and obtain tokens on its own behalf, without a user.' },
];

function HelpTooltip({ content }) {
  return (
    <Tooltip content={content}>
      <span className={styles.helpIcon} tabIndex={0}>?</span>
    </Tooltip>
  );
}

function SecretField({ value, onRegenerate }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
    }
  };

  return (
    <InputGroup>
      <InputGroupItem isFill>
        <TextInput
          id="clientSecret"
          type={isVisible ? 'text' : 'password'}
          value={value ?? ''}
          placeholder={value ? undefined : 'Regenerate to view a secret'}
          readOnlyVariant="default"
          aria-label="Client secret"
        />
      </InputGroupItem>
      <InputGroupItem>
        <Button
          type="button"
          variant="control"
          isDisabled={!value}
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Hide client secret' : 'Show client secret'}
        >
          {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
        </Button>
      </InputGroupItem>
      <InputGroupItem>
        <Tooltip content={isCopied ? 'Copied' : 'Copy'}>
          <Button
            type="button"
            variant="control"
            isDisabled={!value}
            onClick={handleCopy}
            aria-label="Copy client secret"
          >
            <CopyIcon />
          </Button>
        </Tooltip>
      </InputGroupItem>
      <InputGroupItem>
        <Button
          type="button"
          variant="control"
          onClick={onRegenerate}
          aria-label="Regenerate secret"
          className={styles.regenerateButton}
        >
          <SyncAltIcon />
          <span className={styles.regenerateLabel}>Regenerate secret</span>
        </Button>
      </InputGroupItem>
    </InputGroup>
  );
}

function joinList(values) {
  return (values ?? []).join('\n');
}

function splitList(value) {
  return (value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);
  const toast = useToast();

  const {
    data: client, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['clients', clientId],
    queryFn: () => getClient(clientId),
  });

  const [isRotateConfirmOpen, setIsRotateConfirmOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateError, setRotateError] = useState(null);

  const {
    register, handleSubmit, control, reset, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(updateClientSchema) });
  const isPersistent = useWatch({ control, name: 'persistentRefreshToken' });
  const watchedGrantTypes = useWatch({ control, name: 'grantTypes' });

  const resetToClient = (current) => {
    if (!current) return;
    reset({
      name: current.name,
      description: current.description ?? '',
      redirectUris: joinList(current.redirectUris),
      scopes: joinList(current.scopes),
      enabled: current.enabled,
      grantTypes: current.grantTypes ?? [],
      persistentRefreshToken: current.refreshTokenRotationEnabled === false,
      refreshTokenTtlDays: current.refreshTokenTtlDays != null ? String(current.refreshTokenTtlDays) : '',
      refreshTokenMaxLifetimeDays: current.refreshTokenMaxLifetimeDays != null ? String(current.refreshTokenMaxLifetimeDays) : '',
      revokePriorSessionsOnLogin: current.revokePriorSessionsOnLogin ?? true,
    });
  };

  useEffect(() => {
    resetToClient(client);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const onInvalid = () => {
    setServerError('Some fields are invalid. Fix the highlighted fields and save again.');
  };

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const updated = await updateClient(clientId, {
        name: values.name,
        description: values.description || null,
        redirectUris: splitList(values.redirectUris),
        scopes: splitList(values.scopes),
        enabled: values.enabled,
        grantTypes: values.grantTypes,
        ...buildRefreshTokenPayload(values),
      });
      queryClient.setQueryData(['clients', clientId], updated);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client application updated');
    } catch (err) {
      setServerError(err.message);
    }
  };

  const closeRotateConfirm = () => {
    if (isRotating) return;
    setIsRotateConfirmOpen(false);
    setRotateError(null);
  };

  const confirmRotateSecret = async () => {
    setRotateError(null);
    setIsRotating(true);
    try {
      const result = await rotateSecret(clientId);
      queryClient.setQueryData(['clients', clientId], (current) => (
        current ? { ...current, clientSecret: result.clientSecret } : current
      ));
      setIsRotateConfirmOpen(false);
    } catch (err) {
      setRotateError(err.message);
    } finally {
      setIsRotating(false);
    }
  };

  const grantTypes = watchedGrantTypes ?? client?.grantTypes ?? [];

  const settingsTab = client && (
    <Form onSubmit={handleSubmit(onSubmit, onInvalid)} className={styles.formBody} isHorizontal>
      <h2 className={styles.subheading}>General settings</h2>

      <FormGroup label="Client ID" fieldId="clientId">
        <TextInput id="clientId" value={client.clientId} readOnlyVariant="default" />
      </FormGroup>

      <FormGroup label="Name" isRequired fieldId="name">
        <TextInput id="name" {...register('name')} validated={errors.name ? 'error' : 'default'} />
        {errors.name && <div className={styles.fieldError}>{errors.name.message}</div>}
      </FormGroup>

      <FormGroup label="Description" fieldId="description">
        <TextArea id="description" {...register('description')} />
      </FormGroup>

      <h2 className={styles.subheading}>Capability config</h2>

      <FormGroup
        label="Client authentication"
        fieldId="clientAuthentication"
        labelHelp={<HelpTooltip content="Whether this client has a secret (CONFIDENTIAL) or is public (PUBLIC). Set at creation, not editable here." />}
      >
        <Switch
          id="clientAuthentication"
          label="On"
          labelOff="Off"
          isChecked={client.type === 'CONFIDENTIAL'}
          isDisabled
        />
      </FormGroup>

      {client.type === 'CONFIDENTIAL' && (
        <FormGroup
          label="Client secret"
          fieldId="clientSecret"
          labelHelp={<HelpTooltip content="Viewable and copyable any time, like Keycloak's own Credentials tab. Regenerate to replace it with a new one; the previous secret stops working immediately." />}
        >
          <SecretField value={client.clientSecret ?? null} onRegenerate={() => setIsRotateConfirmOpen(true)} />
        </FormGroup>
      )}

      <FormGroup
        label="Authentication flow"
        fieldId="grantTypes"
        labelHelp={<HelpTooltip content="Removing a flow does not sign out tokens already issued. Refresh token can't be removed while Persistent refresh token is on." />}
      >
        <Controller
          name="grantTypes"
          control={control}
          render={({ field }) => (
            <div className={styles.grantTypeGrid}>
              {GRANT_TYPE_OPTIONS.map((option) => (
                <div key={option.value} className={styles.grantTypeItem}>
                  <Checkbox
                    id={`grantType-${option.value}`}
                    label={option.label}
                    isChecked={(field.value ?? []).includes(option.value)}
                    onChange={(_event, checked) => {
                      const current = field.value ?? [];
                      field.onChange(
                        checked
                          ? [...current, option.value]
                          : current.filter((v) => v !== option.value)
                      );
                    }}
                  />
                  <HelpTooltip content={option.help} />
                </div>
              ))}
            </div>
          )}
        />
        {errors.grantTypes?.message && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant="error">{errors.grantTypes.message}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>

      <RefreshTokenSettingsFields
        control={control}
        register={register}
        errors={errors}
        isPersistent={isPersistent}
        isDisabled={!grantTypes.includes('refresh_token') && !isPersistent}
        disabledReason="Enable the Refresh token authentication flow above to use persistent refresh tokens."
      />

      <h2 className={styles.subheading}>Access settings</h2>

      <FormGroup label="Redirect URIs" fieldId="redirectUris">
        <TextArea id="redirectUris" {...register('redirectUris')} placeholder="One per line" />
      </FormGroup>

      <FormGroup label="Scopes" fieldId="scopes">
        <TextArea id="scopes" {...register('scopes')} placeholder="One per line, or comma-separated" />
      </FormGroup>

      {serverError && <Alert variant="danger" isInline title={serverError} className={styles.serverError} />}

      <div className={styles.actions}>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Save
        </Button>
        <Button type="button" variant="link" onClick={() => {
          resetToClient(client);
          setServerError(null);
        }}>
          Revert
        </Button>
      </div>
    </Form>
  );

  return (
    <div className={styles.pageBody}>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {client && (
          <>
            <AppBreadcrumb items={[{ label: 'Clients', to: '/clients' }, { label: client.clientId }]} />

            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>{client.name}</h1>
                <p className={styles.meta}>
                  {`Created ${formatDate(client.createdAt)} · Updated ${formatDate(client.updatedAt)}`}
                </p>
              </div>

              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="enabled"
                    isChecked={field.value ?? false}
                    onChange={(_event, checked) => field.onChange(checked)}
                    label="Enabled"
                    className={styles.enabledSwitch}
                  />
                )}
              />
            </div>

            <Tabs
              ariaLabel="Client details"
              tabs={[{ key: 'settings', title: 'Settings', content: settingsTab }]}
            />

            {isRotateConfirmOpen && (
              <Modal
                isOpen
                onClose={closeRotateConfirm}
                title="Regenerate client secret?"
                footer={
                  <>
                    <Button variant="danger" onClick={confirmRotateSecret} isLoading={isRotating}>
                      Regenerate
                    </Button>
                    <Button variant="link" onClick={closeRotateConfirm} isDisabled={isRotating}>
                      Cancel
                    </Button>
                  </>
                }
              >
                {rotateError && <Alert variant="danger" title={rotateError} />}
                <p>
                  This generates a new client secret and replaces the stored one immediately.
                  The previous secret stops working right away - update anywhere this client is
                  configured with the new value.
                </p>
              </Modal>
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}

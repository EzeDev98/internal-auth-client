import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Form, FormGroup, TextInput, TextArea, Checkbox, Switch, Alert, Tooltip,
} from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import QueryState from '../../shared/components/QueryState';
import Button from '../../shared/components/Button';
import Tabs from '../../shared/components/Tabs';
import { getClient, updateClient } from './api';
import { updateClientSchema } from './updateClientSchema';
import styles from './ClientDetailPage.module.css';

// Same fixed list CreateClientPage shows in its "Authentication flow" grid
// (the only three grantTypes the backend accepts). Reused here read-only,
// checked according to what this client actually has - grantTypes isn't
// editable post-creation (UpdateClientApplicationRequest's own Javadoc),
// so these render as disabled checkboxes rather than an editable field.
const GRANT_TYPE_OPTIONS = [
  { value: 'authorization_code', label: 'Authorization code', help: 'Lets this client obtain tokens via the OAuth 2.0 authorization code flow.' },
  { value: 'refresh_token', label: 'Refresh token', help: 'Lets this client request a refresh token alongside its access token.' },
  { value: 'client_credentials', label: 'Client credentials', help: 'Lets this client authenticate and obtain tokens on its own behalf, without a user.' },
];

// Same small "?" trigger as CreateClientPage's own HelpTooltip - kept as
// its own local copy here rather than a shared import, same as that file
// does.
function HelpTooltip({ content }) {
  return (
    <Tooltip content={content}>
      <span className={styles.helpIcon} tabIndex={0}>?</span>
    </Tooltip>
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

// Step 6C - detail/edit, backed by Step 2B's GET/PATCH
// /client-applications/{clientId}. Field design deliberately reuses
// CreateClientPage's own look (isHorizontal Form, the same flat/square
// form-control styling, the same HelpTooltip and grant-type grid) rather
// than a second one-off style, since that page is already the Keycloak
// reference for this app. clientId, type and grantTypes aren't editable
// here - UpdateClientApplicationRequest's own Javadoc says so directly -
// so they render disabled instead of as live inputs. Keycloak's Roles,
// Client scopes, Sessions and Advanced tabs have no backing service on
// our side (no per-client roles/scopes/sessions/advanced-config
// endpoint), so only Settings is rendered as a tab - nothing stubbed in
// for the rest.
export default function ClientDetailPage() {
  const { clientId } = useParams();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);
  const [saved, setSaved] = useState(false);

  const {
    data: client, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['clients', clientId],
    queryFn: () => getClient(clientId),
  });

  const {
    register, handleSubmit, control, reset, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(updateClientSchema) });

  const resetToClient = (current) => {
    if (!current) return;
    reset({
      name: current.name,
      description: current.description ?? '',
      redirectUris: joinList(current.redirectUris),
      scopes: joinList(current.scopes),
      enabled: current.enabled,
    });
    setServerError(null);
    setSaved(false);
  };

  useEffect(() => {
    resetToClient(client);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const onSubmit = async (values) => {
    setServerError(null);
    setSaved(false);
    try {
      const updated = await updateClient(clientId, {
        name: values.name,
        description: values.description || null,
        redirectUris: splitList(values.redirectUris),
        scopes: splitList(values.scopes),
        enabled: values.enabled,
      });
      queryClient.setQueryData(['clients', clientId], updated);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSaved(true);
    } catch (err) {
      setServerError(err.message);
    }
  };

  if (isLoading || isError) {
    return (
      <div className={styles.pageBody}>
        <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />
      </div>
    );
  }

  const grantTypes = client.grantTypes ?? [];

  const settingsTab = (
    <Form onSubmit={handleSubmit(onSubmit)} className={styles.formBody} isHorizontal>
      {serverError && <Alert variant="danger" isInline title={serverError} className={styles.serverError} />}
      {saved && <Alert variant="success" isInline title="Client application updated" className={styles.serverError} />}

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

      <FormGroup
        label="Authentication flow"
        fieldId="grantTypes"
        labelHelp={<HelpTooltip content="Set at creation. Not editable here." />}
      >
        <div className={styles.grantTypeGrid}>
          {GRANT_TYPE_OPTIONS.map((option) => (
            <div key={option.value} className={styles.grantTypeItem}>
              <Checkbox
                id={`grantType-${option.value}`}
                label={option.label}
                isChecked={grantTypes.includes(option.value)}
                isDisabled
              />
              <HelpTooltip content={option.help} />
            </div>
          ))}
        </div>
      </FormGroup>

      <h2 className={styles.subheading}>Access settings</h2>

      <FormGroup label="Redirect URIs" fieldId="redirectUris">
        <TextArea id="redirectUris" {...register('redirectUris')} placeholder="One per line" />
      </FormGroup>

      <FormGroup label="Scopes" fieldId="scopes">
        <TextArea id="scopes" {...register('scopes')} placeholder="One per line, or comma-separated" />
      </FormGroup>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Save
        </Button>
        <Button type="button" variant="link" onClick={() => resetToClient(client)}>
          Revert
        </Button>
      </div>
    </Form>
  );

  return (
    <div className={styles.pageBody}>
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
    </div>
  );
}

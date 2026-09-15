import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, FormGroup, TextInput, TextArea, Switch, Alert } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import QueryState from '../../shared/components/QueryState';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Tabs from '../../shared/components/Tabs';
import { getClient, updateClient } from './api';
import { updateClientSchema } from './updateClientSchema';
import styles from './ClientDetailPage.module.css';

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
// /client-applications/{clientId}. Laid out after Keycloak's client
// "Settings" tab (General settings / Capability config / Access settings
// groupings, Enabled switch beside the title, Save + Revert at the
// bottom). clientId, type and grantTypes aren't editable here -
// UpdateClientApplicationRequest's own Javadoc says so directly - so
// they're shown read-only instead of as inputs. Keycloak's Roles, Client
// scopes, Sessions and Advanced tabs have no backing service on our side
// (no per-client roles/scopes/sessions/advanced-config endpoint), so only
// Settings is rendered as a tab - nothing stubbed in for the rest.
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

  const settingsTab = (
    <Form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {serverError && <Alert variant="danger" title={serverError} className={styles.alert} />}
      {saved && <Alert variant="success" title="Client application updated" className={styles.alert} />}

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

      <dl className={styles.readonlyGrid}>
        <dt>Client type</dt>
        <dd><Badge className={styles.typeBadge}>{client.type}</Badge></dd>
        <dt>Grant types</dt>
        <dd>
          {client.grantTypes?.length
            ? client.grantTypes.map((grantType) => (
                <Badge key={grantType} className={styles.grantBadge}>{grantType}</Badge>
              ))
            : '—'}
        </dd>
      </dl>

      <h2 className={styles.subheading}>Access settings</h2>

      <FormGroup label="Redirect URIs" fieldId="redirectUris">
        <TextArea id="redirectUris" {...register('redirectUris')} placeholder="One per line" />
      </FormGroup>

      <h2 className={styles.subheading}>Scopes</h2>

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

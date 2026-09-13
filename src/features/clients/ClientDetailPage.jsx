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

// Step 6C - detail/edit, backed by Step 2B's GET/PATCH
// /client-applications/{clientId}. grantTypes and the client secret aren't
// editable here - UpdateClientApplicationRequest's own Javadoc says so
// directly - so they're shown read-only alongside the editable fields.
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

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        description: client.description ?? '',
        redirectUris: joinList(client.redirectUris),
        scopes: joinList(client.scopes),
        enabled: client.enabled,
      });
    }
  }, [client, reset]);

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

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Clients', to: '/clients' }, { label: client.clientId }]} />

      <h1 className={styles.title}>{client.name}</h1>

      <dl className={styles.readonlyGrid}>
        <dt>Client ID</dt>
        <dd>{client.clientId}</dd>
        <dt>Type</dt>
        <dd><Badge>{client.type}</Badge></dd>
        <dt>Grant types</dt>
        <dd>
          {client.grantTypes?.length
            ? client.grantTypes.map((grantType) => (
                <Badge key={grantType} className={styles.grantBadge}>{grantType}</Badge>
              ))
            : '—'}
        </dd>
        <dt>Created</dt>
        <dd>{client.createdAt ? new Date(client.createdAt).toLocaleString() : '—'}</dd>
        <dt>Updated</dt>
        <dd>{client.updatedAt ? new Date(client.updatedAt).toLocaleString() : '—'}</dd>
      </dl>

      <Form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {serverError && <Alert variant="danger" title={serverError} />}
        {saved && <Alert variant="success" title="Client application updated" />}

        <FormGroup label="Name" isRequired fieldId="name">
          <TextInput id="name" {...register('name')} validated={errors.name ? 'error' : 'default'} />
          {errors.name && <div className={styles.fieldError}>{errors.name.message}</div>}
        </FormGroup>

        <FormGroup label="Description" fieldId="description">
          <TextArea id="description" {...register('description')} />
        </FormGroup>

        <FormGroup label="Redirect URIs" fieldId="redirectUris">
          <TextArea id="redirectUris" {...register('redirectUris')} placeholder="One per line" />
        </FormGroup>

        <FormGroup label="Scopes" fieldId="scopes">
          <TextArea id="scopes" {...register('scopes')} placeholder="One per line, or comma-separated" />
        </FormGroup>

        <FormGroup label="Enabled" fieldId="enabled">
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="enabled"
                isChecked={field.value}
                onChange={(_event, checked) => field.onChange(checked)}
                label="Enabled"
              />
            )}
          />
        </FormGroup>

        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Save changes
        </Button>
      </Form>
    </div>
  );
}

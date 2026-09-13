import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormGroup, TextInput, TextArea, Checkbox, Alert, ClipboardCopy } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { createClient } from './api';
import { createClientSchema } from './createClientSchema';
import styles from './CreateClientModal.module.css';

const GRANT_TYPE_OPTIONS = [
  { value: 'client_credentials', label: 'Client credentials' },
  { value: 'authorization_code', label: 'Authorization code' },
  { value: 'refresh_token', label: 'Refresh token' },
];

function splitList(value) {
  return (value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Step 6B - existing POST /client-applications, usable today per the plan.
// The server generates and returns the client secret exactly once
// (CreateClientApplicationResponse's own Javadoc says so directly), so
// this modal has a second phase after submit that shows it for copying -
// there is no way to retrieve it again short of rotating it (a later step).
export default function CreateClientModal({ onClose, onCreated }) {
  const [serverError, setServerError] = useState(null);
  const [created, setCreated] = useState(null);

  const {
    register, handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createClientSchema),
    defaultValues: { grantTypes: [] },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const result = await createClient({
        clientId: values.clientId,
        name: values.name,
        description: values.description || undefined,
        redirectUris: splitList(values.redirectUris),
        scopes: splitList(values.scopes),
        grantTypes: values.grantTypes,
      });
      setCreated(result);
    } catch (err) {
      setServerError(err.message);
    }
  };

  if (created) {
    return (
      <Modal
        isOpen
        onClose={onCreated}
        title="Client application created"
        footer={<Button variant="primary" onClick={onCreated}>Done</Button>}
      >
        <Alert
          variant="warning"
          isInline
          title="Save this client secret now - it will not be shown again."
          className={styles.secretWarning}
        />
        <p className={styles.secretLabel}>Client secret</p>
        <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
          {created.clientSecret}
        </ClipboardCopy>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create client application"
      footer={
        <>
          <Button type="submit" form="create-client-form" isLoading={isSubmitting} variant="primary">
            Create
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <Form id="create-client-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Client ID" isRequired fieldId="clientId">
          <TextInput id="clientId" {...register('clientId')} validated={errors.clientId ? 'error' : 'default'} />
          {errors.clientId && <div className={styles.fieldError}>{errors.clientId.message}</div>}
        </FormGroup>

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

        <FormGroup label="Grant types" fieldId="grantTypes">
          <Controller
            name="grantTypes"
            control={control}
            render={({ field }) => (
              <>
                {GRANT_TYPE_OPTIONS.map((option) => (
                  <Checkbox
                    key={option.value}
                    id={`grantType-${option.value}`}
                    label={option.label}
                    isChecked={field.value.includes(option.value)}
                    onChange={(_event, checked) => {
                      field.onChange(
                        checked
                          ? [...field.value, option.value]
                          : field.value.filter((v) => v !== option.value)
                      );
                    }}
                  />
                ))}
              </>
            )}
          />
        </FormGroup>
      </Form>
    </Modal>
  );
}

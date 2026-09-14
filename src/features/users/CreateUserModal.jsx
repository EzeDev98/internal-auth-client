import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Form, FormGroup, TextInput, FormSelect, FormSelectOption, Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import PasswordInput from '../../shared/components/PasswordInput';
import { listClients } from '../clients/api';
import { createUser } from './api';
import { createUserSchema } from './createUserSchema';
import styles from './CreateUserModal.module.css';

// Step 7C - existing POST /users (Step 2G on the server), usable today
// despite the plan marking it "Needed" - same pattern as every other
// Users/Clients/Sessions endpoint this feature has found already built.
// clientId is required upstream (a user is always scoped to one client
// application - see AdminUserController's own Javadoc), so this loads
// Step 6A's existing client list to populate a picker rather than asking
// the admin to type a raw clientId string from memory.
export default function CreateUserModal({ onClose, onCreated }) {
  const [serverError, setServerError] = useState(null);

  const { data: clientsPage, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', 'for-user-create'],
    queryFn: () => listClients({ size: 100 }),
  });
  const clients = clientsPage?.content ?? [];

  const {
    register, handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { clientId: '', username: '', phoneNumber: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await createUser(values.clientId, {
        username: values.username,
        phoneNumber: values.phoneNumber || undefined,
        email: values.email || undefined,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      onCreated();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create user"
      footer={
        <>
          <Button type="submit" form="create-user-form" isLoading={isSubmitting} variant="primary">
            Create
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <Form id="create-user-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Client application" isRequired fieldId="clientId">
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <FormSelect
                id="clientId"
                value={field.value}
                onChange={(_event, value) => field.onChange(value)}
                validated={errors.clientId ? 'error' : 'default'}
              >
                <FormSelectOption value="" label={clientsLoading ? 'Loading...' : 'Select a client application'} isDisabled />
                {clients.map((client) => (
                  <FormSelectOption key={client.clientId} value={client.clientId} label={`${client.name} (${client.clientId})`} />
                ))}
              </FormSelect>
            )}
          />
          {errors.clientId && <div className={styles.fieldError}>{errors.clientId.message}</div>}
        </FormGroup>

        <FormGroup label="Username" isRequired fieldId="username">
          <TextInput id="username" {...register('username')} validated={errors.username ? 'error' : 'default'} />
          {errors.username && <div className={styles.fieldError}>{errors.username.message}</div>}
        </FormGroup>

        <FormGroup label="Phone number" fieldId="phoneNumber">
          <TextInput id="phoneNumber" {...register('phoneNumber')} validated={errors.phoneNumber ? 'error' : 'default'} />
          {errors.phoneNumber && <div className={styles.fieldError}>{errors.phoneNumber.message}</div>}
        </FormGroup>

        <FormGroup label="Email" fieldId="email">
          <TextInput id="email" type="email" {...register('email')} validated={errors.email ? 'error' : 'default'} />
          {errors.email && <div className={styles.fieldError}>{errors.email.message}</div>}
        </FormGroup>

        <FormGroup label="Password" isRequired fieldId="password">
          <PasswordInput id="password" {...register('password')} validated={errors.password ? 'error' : 'default'} />
          {errors.password && <div className={styles.fieldError}>{errors.password.message}</div>}
        </FormGroup>

        <FormGroup label="Confirm password" isRequired fieldId="confirmPassword">
          <PasswordInput id="confirmPassword" {...register('confirmPassword')} validated={errors.confirmPassword ? 'error' : 'default'} />
          {errors.confirmPassword && <div className={styles.fieldError}>{errors.confirmPassword.message}</div>}
        </FormGroup>
      </Form>
    </Modal>
  );
}

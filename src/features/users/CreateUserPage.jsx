import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Form, FormGroup, TextInput, Alert,
  Dropdown, DropdownList, DropdownItem, MenuToggle,
} from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Button from '../../shared/components/Button';
import PasswordInput from '../../shared/components/PasswordInput';
import { listClients } from '../clients/api';
import { createUser } from './api';
import { createUserSchema } from './createUserSchema';
import styles from './CreateUserPage.module.css';

// Same reasoning as UsersListPage's StatusFilterDropdown - a native
// <select> (FormSelect) renders its popup via the OS/browser, not us,
// which is why it showed up as a plain dark system dropdown instead of
// matching the app's own light popper/menu styling. This is a real
// anchored PatternFly Dropdown/MenuToggle instead, styled via
// .clientToggle in CreateUserPage.module.css to read as the same
// underline-only field as every TextInput/PasswordInput on this page.
function ClientApplicationDropdown({ value, onChange, clients, isLoading, isError }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = clients.find((client) => client.clientId === value);
  const label = selected
    ? `${selected.name} (${selected.clientId})`
    : (isLoading ? 'Loading...' : 'Select a client application');

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          id="clientId"
          aria-label="Select a client application"
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          isDisabled={isLoading}
          validated={isError ? 'error' : 'default'}
          className={styles.clientToggle}
        >
          {label}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {clients.map((client) => (
          <DropdownItem
            key={client.clientId}
            icon={client.clientId === value ? <CheckIcon /> : <span className={styles.checkPlaceholder} />}
            onClick={() => {
              onChange(client.clientId);
              setIsOpen(false);
            }}
          >
            {`${client.name} (${client.clientId})`}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

// Replaces CreateUserModal - same POST /users call (Step 7C), but restyled
// as its own routed page to match Keycloak's own Create user screen (a
// plain page with a horizontal label/field grid), the same way
// CreateClientPage already replaced a Create client modal. No Wizard here
// (Keycloak's Create user isn't a multi-step flow), just one
// Form isHorizontal, same as CreateClientPage's own step body.
export default function CreateUserPage() {
  const navigate = useNavigate();
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

  const goToUsers = () => navigate('/users');

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
      goToUsers();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Users', to: '/users' }, { label: 'Create user' }]} />

      <h1 className={styles.title}>Create user</h1>

      <div className={styles.divider} />

      {serverError && <Alert variant="danger" isInline title={serverError} className={styles.serverError} />}

      <Form className={styles.formBody} isHorizontal onSubmit={handleSubmit(onSubmit)}>
        <FormGroup label="Client application" isRequired fieldId="clientId">
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <ClientApplicationDropdown
                value={field.value}
                onChange={field.onChange}
                clients={clients}
                isLoading={clientsLoading}
                isError={Boolean(errors.clientId)}
              />
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

        <div className={styles.actions}>
          <Button type="submit" isLoading={isSubmitting} variant="primary">
            Create
          </Button>
          <Button variant="link" onClick={goToUsers}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}

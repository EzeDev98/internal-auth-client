import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormGroup, TextInput, TextArea, Alert } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Button from '../../shared/components/Button';
import { createRole } from './api';
import { createRoleSchema } from './createRoleSchema';
import styles from './CreateRolePage.module.css';

// Replaces CreateRoleModal - same POST /roles call (Step 8B), restyled as
// its own routed page to match Keycloak's own Create role screen, the same
// way CreateUserPage already replaced CreateUserModal (see that page's own
// comment for the general rationale). Just Role name + Description here,
// so no Controller/dropdown field is needed like CreateUserPage's client
// application picker.
export default function CreateRolePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createRoleSchema) });

  const goToRoles = () => navigate('/roles');

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await createRole({
        roleName: values.roleName,
        description: values.description || undefined,
      });
      goToRoles();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Roles', to: '/roles' }, { label: 'Create role' }]} />

      <h1 className={styles.title}>Create role</h1>

      <div className={styles.divider} />

      {serverError && <Alert variant="danger" isInline title={serverError} className={styles.serverError} />}

      <Form className={styles.formBody} isHorizontal onSubmit={handleSubmit(onSubmit)}>
        <FormGroup label="Role name" isRequired fieldId="roleName">
          <TextInput id="roleName" {...register('roleName')} validated={errors.roleName ? 'error' : 'default'} />
          {errors.roleName && <div className={styles.fieldError}>{errors.roleName.message}</div>}
        </FormGroup>

        <FormGroup label="Description" fieldId="description">
          <TextArea id="description" {...register('description')} />
        </FormGroup>

        <div className={styles.actions}>
          <Button type="submit" isLoading={isSubmitting} variant="primary">
            Save
          </Button>
          <Button variant="link" onClick={goToRoles}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}

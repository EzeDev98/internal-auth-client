import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormGroup, TextInput, TextArea, Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { createRole } from './api';
import { createRoleSchema } from './createRoleSchema';
import styles from './CreateRoleModal.module.css';

// Step 8B - existing POST /roles (PermissionController#createRole), wired
// to a frontend modal for the first time. No secret/reveal step like
// CreateClientModal - RoleResponse carries no sensitive value.
export default function CreateRoleModal({ onClose, onCreated }) {
  const [serverError, setServerError] = useState(null);

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createRoleSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await createRole({
        roleName: values.roleName,
        description: values.description || undefined,
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
      title="Create role"
      footer={
        <>
          <Button type="submit" form="create-role-form" isLoading={isSubmitting} variant="primary">
            Create
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <Form id="create-role-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Role name" isRequired fieldId="roleName">
          <TextInput id="roleName" {...register('roleName')} validated={errors.roleName ? 'error' : 'default'} />
          {errors.roleName && <div className={styles.fieldError}>{errors.roleName.message}</div>}
        </FormGroup>

        <FormGroup label="Description" fieldId="description">
          <TextArea id="description" {...register('description')} />
        </FormGroup>
      </Form>
    </Modal>
  );
}

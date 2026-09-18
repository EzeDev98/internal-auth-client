import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormGroup, TextInput, TextArea, Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { createGroup, createSubgroup } from './api';
import { createGroupSchema } from './createGroupSchema';
import { useToast } from '../../shared/lib/toastContext';
import styles from './CreateGroupModal.module.css';

// Step 9B - existing POST /groups (top-level) and POST
// /groups/{parentGroupName}/subgroups (PermissionController#createSuperGroup
// / #createSubGroup), wired to a single modal shared by both cases -
// presence of `parentGroupName` picks the endpoint, since both requests
// carry the same groupName + description shape. No secret/reveal step,
// same as CreateRoleModal - neither response carries a sensitive value.
export default function CreateGroupModal({ parentGroupName, onClose, onCreated }) {
  const [serverError, setServerError] = useState(null);
  const toast = useToast();

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createGroupSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      const payload = { groupName: values.groupName, description: values.description || undefined };
      if (parentGroupName) {
        await createSubgroup(parentGroupName, payload);
      } else {
        await createGroup(payload);
      }
      toast.success(parentGroupName ? 'Subgroup created' : 'Group created');
      onCreated();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={parentGroupName ? `Add subgroup to ${parentGroupName}` : 'Create group'}
      footer={
        <>
          <Button type="submit" form="create-group-form" isLoading={isSubmitting} variant="primary">
            Create
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <Form id="create-group-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Group name" isRequired fieldId="groupName">
          <TextInput id="groupName" {...register('groupName')} validated={errors.groupName ? 'error' : 'default'} />
          {errors.groupName && <div className={styles.fieldError}>{errors.groupName.message}</div>}
        </FormGroup>

        <FormGroup label="Description" fieldId="description">
          <TextArea id="description" {...register('description')} />
        </FormGroup>
      </Form>
    </Modal>
  );
}

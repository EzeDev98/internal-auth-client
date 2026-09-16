import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormGroup, TextInput, Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { renameSubgroup } from './api';
import { renameGroupSchema } from './renameGroupSchema';
import styles from './RenameGroupModal.module.css';

// UI-only for now - see the TODO(backend) note above renameSubgroup in
// api.js. There's no PATCH endpoint for a subgroup's name on the BFF or on
// internal-auth-server yet, so submitting this will fail until that's
// built; wired up ahead of that work per the "Child groups" actions-menu
// request. Same Modal + react-hook-form/zod shell as CreateGroupModal.
export default function RenameGroupModal({ parentGroupName, groupName, onClose, onRenamed }) {
  const [serverError, setServerError] = useState(null);

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(renameGroupSchema), defaultValues: { groupName } });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await renameSubgroup(parentGroupName, groupName, { groupName: values.groupName });
      onRenamed();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Rename ${groupName}`}
      footer={
        <>
          <Button type="submit" form="rename-group-form" isLoading={isSubmitting} variant="primary">
            Save
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <Form id="rename-group-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Group name" isRequired fieldId="groupName">
          <TextInput id="groupName" {...register('groupName')} validated={errors.groupName ? 'error' : 'default'} />
          {errors.groupName && <div className={styles.fieldError}>{errors.groupName.message}</div>}
        </FormGroup>
      </Form>
    </Modal>
  );
}

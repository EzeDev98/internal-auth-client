// Form for creating a top-level group.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormGroup, TextInput, TextArea, Alert } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Button from '../../shared/components/Button';
import { createGroup } from './api';
import { createGroupSchema } from './createGroupSchema';
import { useToast } from '../../shared/lib/useToast';
import styles from './CreateGroupPage.module.css';

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const toast = useToast();

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createGroupSchema) });

  const goToGroups = () => navigate('/groups');

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await createGroup({
        groupName: values.groupName,
        description: values.description || undefined,
      });
      toast.success('Group created');
      goToGroups();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Groups', to: '/groups' }, { label: 'Create group' }]} />

      <h1 className={styles.title}>Create group</h1>

      <div className={styles.divider} />

      {serverError && <Alert variant="danger" isInline title={serverError} className={styles.serverError} />}

      <Form className={styles.formBody} isHorizontal onSubmit={handleSubmit(onSubmit)}>
        <FormGroup label="Group name" isRequired fieldId="groupName">
          <TextInput id="groupName" {...register('groupName')} validated={errors.groupName ? 'error' : 'default'} />
          {errors.groupName && <div className={styles.fieldError}>{errors.groupName.message}</div>}
        </FormGroup>

        <FormGroup label="Description" fieldId="description">
          <TextArea id="description" {...register('description')} />
        </FormGroup>

        <div className={styles.actions}>
          <Button type="submit" isLoading={isSubmitting} variant="primary">
            Save
          </Button>
          <Button variant="link" onClick={goToGroups}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}

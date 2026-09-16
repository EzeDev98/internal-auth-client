import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormGroup, TextInput, TextArea, Alert } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Button from '../../shared/components/Button';
import { createGroup } from './api';
import { createGroupSchema } from './createGroupSchema';
import styles from './CreateGroupPage.module.css';

// Replaces the top-level "Create group" modal on GroupsListPage - same
// POST /groups call (Step 9B), restyled as its own routed page to match
// Keycloak's own Create group screen, the same way CreateRolePage already
// replaced CreateRoleModal (see that page's own comment for the general
// rationale). Just Group name + Description here, same shape as
// CreateRolePage. Subgroup creation (CreateGroupModal with a
// parentGroupName, opened from GroupDetailPage) is untouched - that stays
// a modal, since it's a secondary action nested inside a group's own page
// rather than the primary "Create group" flow this replaces.
export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

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

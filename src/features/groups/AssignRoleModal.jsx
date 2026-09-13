import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Form, FormGroup, FormSelect, FormSelectOption, Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { listRoles } from '../roles/api';
import { assignRoleToGroup, assignRoleToSubgroup } from './api';
import { assignRoleSchema } from './assignRoleSchema';
import styles from './AssignRoleModal.module.css';

// Step 9B - existing POST /groups/{groupName}/roles and POST
// /groups/{parentGroupName}/subgroups/{subGroupName}/roles
// (PermissionController#assignRoleToGroup / #assignRoleToSubGroup), wired
// to a single modal shared by both cases: `target` is either
// { groupName } for a top-level group or { parentGroupName, subGroupName }
// for a subgroup. Reuses Step 8A's existing listRoles() to populate the
// picker (same pattern as CreateUserModal's client-application picker)
// rather than asking the admin to type a raw role name from memory.
export default function AssignRoleModal({ target, onClose, onAssigned }) {
  const [serverError, setServerError] = useState(null);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', 'for-group-assign'],
    queryFn: listRoles,
  });

  const {
    handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(assignRoleSchema), defaultValues: { roleName: '' } });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (target.subGroupName) {
        await assignRoleToSubgroup(target.parentGroupName, target.subGroupName, { roleName: values.roleName });
      } else {
        await assignRoleToGroup(target.groupName, { roleName: values.roleName });
      }
      onAssigned();
    } catch (err) {
      setServerError(err.message);
    }
  };

  const targetLabel = target.subGroupName ? target.subGroupName : target.groupName;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Assign role to ${targetLabel}`}
      footer={
        <>
          <Button type="submit" form="assign-role-form" isLoading={isSubmitting} variant="primary">
            Assign
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <Form id="assign-role-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Role" isRequired fieldId="roleName">
          <Controller
            name="roleName"
            control={control}
            render={({ field }) => (
              <FormSelect
                id="roleName"
                value={field.value}
                onChange={(_event, value) => field.onChange(value)}
                validated={errors.roleName ? 'error' : 'default'}
              >
                <FormSelectOption value="" label={rolesLoading ? 'Loading...' : 'Select a role'} isDisabled />
                {(roles ?? []).map((role) => (
                  <FormSelectOption key={role.id} value={role.roleName} label={role.roleName} />
                ))}
              </FormSelect>
            )}
          />
          {errors.roleName && <div className={styles.fieldError}>{errors.roleName.message}</div>}
        </FormGroup>
      </Form>
    </Modal>
  );
}

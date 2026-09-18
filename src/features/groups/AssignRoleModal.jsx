import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Form, FormGroup, Alert,
  Dropdown, DropdownList, DropdownItem, MenuToggle,
} from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import Modal from '../../shared/components/Modal';
import QueryState from '../../shared/components/QueryState';
import Button from '../../shared/components/Button';
import { listRoles } from '../roles/api';
import { assignRoleToGroup, assignRoleToSubgroup } from './api';
import { assignRoleSchema } from './assignRoleSchema';
import { useToast } from '../../shared/lib/toastContext';
import styles from './AssignRoleModal.module.css';

// Same reasoning as UsersListPage's StatusFilterDropdown and CreateUserPage's
// ClientApplicationDropdown - a native <select> (FormSelect) renders its
// popup via the OS/browser, not us, which is why it showed up as a plain
// dark system dropdown instead of matching the app's own light popper/menu
// styling. This is a real anchored PatternFly Dropdown/MenuToggle instead,
// full width to fill the modal's form field the same way FormSelect did.
function RoleDropdown({ value, onChange, roles, isLoading, isError }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = (roles ?? []).find((role) => role.roleName === value);
  const label = selected ? selected.roleName : (isLoading ? 'Loading...' : 'Select a role');

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          id="roleName"
          aria-label="Select a role"
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          isDisabled={isLoading}
          validated={isError ? 'error' : 'default'}
          className={styles.roleToggle}
        >
          {label}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {(roles ?? []).map((role) => (
          <DropdownItem
            key={role.id}
            icon={role.roleName === value ? <CheckIcon /> : <span className={styles.checkPlaceholder} />}
            onClick={() => {
              onChange(role.roleName);
              setIsOpen(false);
            }}
          >
            {role.roleName}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

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
  const toast = useToast();

  const {
    data: roles, isLoading: rolesLoading, isError: rolesIsError, error: rolesError, refetch: rolesRefetch,
  } = useQuery({
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
      toast.success(`Role "${values.roleName}" assigned to ${targetLabel}.`);
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
          <QueryState isLoading={rolesLoading} isError={rolesIsError} error={rolesError} onRetry={rolesRefetch}>
            <Controller
              name="roleName"
              control={control}
              render={({ field }) => (
                <RoleDropdown
                  value={field.value}
                  onChange={field.onChange}
                  roles={roles}
                  isLoading={rolesLoading}
                  isError={Boolean(errors.roleName)}
                />
              )}
            />
            {errors.roleName && <div className={styles.fieldError}>{errors.roleName.message}</div>}
          </QueryState>
        </FormGroup>
      </Form>
    </Modal>
  );
}

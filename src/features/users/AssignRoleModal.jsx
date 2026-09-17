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
import Button from '../../shared/components/Button';
import { listRoles } from '../roles/api';
import { assignRoleSchema } from '../groups/assignRoleSchema';
import { assignRoleToUser } from './api';
import styles from './AssignRoleModal.module.css';

// Same RoleDropdown pattern as groups/AssignRoleModal.jsx's own - a real
// anchored PatternFly Dropdown/MenuToggle instead of a native <select>
// (native popup can't be restyled - same reasoning documented there).
function RoleDropdown({
  value, onChange, roles, isLoading, isError,
}) {
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

// Roles tab "Assign role" button - existing POST /users/{username}/roles
// (PermissionController#assignRoleToUser). Reuses groups/assignRoleSchema
// directly rather than duplicating it - the request body is identical
// ({ roleName }) - and Step 8A's existing listRoles() to populate the
// picker, same pattern as groups/AssignRoleModal.jsx.
export default function AssignRoleModal({ username, onClose, onAssigned }) {
  const [serverError, setServerError] = useState(null);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', 'for-user-assign'],
    queryFn: listRoles,
  });

  const {
    handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(assignRoleSchema), defaultValues: { roleName: '' } });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await assignRoleToUser(username, { roleName: values.roleName });
      onAssigned(values.roleName);
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Assign role to ${username}`}
      footer={(
        <>
          <Button type="submit" form="assign-role-to-user-form" isLoading={isSubmitting} variant="primary">
            Assign
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      )}
    >
      <Form id="assign-role-to-user-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Role" isRequired fieldId="roleName">
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
        </FormGroup>
      </Form>
    </Modal>
  );
}

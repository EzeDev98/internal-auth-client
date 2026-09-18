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
import { listGroups, moveSubgroup } from './api';
import { moveGroupSchema } from './moveGroupSchema';
import { useToast } from '../../shared/lib/toastContext';
import styles from './MoveGroupModal.module.css';

// Same reasoning as AssignRoleModal's RoleDropdown - a real anchored
// Dropdown/MenuToggle rather than a native <select>, so the popup is one
// we control (light background, checkmark) instead of the OS's own list.
function DestinationDropdown({ value, onChange, groups, isLoading, isError }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = (groups ?? []).find((group) => group.groupName === value);
  const label = selected ? selected.groupName : (isLoading ? 'Loading...' : 'Select a destination group');

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          id="destinationGroupName"
          aria-label="Select a destination group"
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          isDisabled={isLoading}
          validated={isError ? 'error' : 'default'}
          className={styles.destinationToggle}
        >
          {label}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {(groups ?? []).map((group) => (
          <DropdownItem
            key={group.id}
            icon={group.groupName === value ? <CheckIcon /> : <span className={styles.checkPlaceholder} />}
            onClick={() => {
              onChange(group.groupName);
              setIsOpen(false);
            }}
          >
            {group.groupName}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

// Destination options come from the existing top-level groups list
// (Step 9A's listGroups), excluding the group's current parent since
// moving it there would be a no-op. Backed by PATCH
// /groups/{parentGroupName}/subgroups/{subGroupName}/move
// (PermissionController#moveSubGroup), proxied via moveSubgroup in api.js.
export default function MoveGroupModal({ parentGroupName, groupName, onClose, onMoved }) {
  const [serverError, setServerError] = useState(null);
  const toast = useToast();

  const {
    data: allGroups, isLoading: groupsLoading, isError: groupsIsError, error: groupsError, refetch: groupsRefetch,
  } = useQuery({
    queryKey: ['groups'],
    queryFn: listGroups,
  });

  const destinationOptions = (allGroups ?? []).filter((group) => group.groupName !== parentGroupName);

  const {
    handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(moveGroupSchema), defaultValues: { destinationGroupName: '' } });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await moveSubgroup(parentGroupName, groupName, { newParentGroupName: values.destinationGroupName });
      toast.success(`Moved "${groupName}" to "${values.destinationGroupName}".`);
      onMoved();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Move ${groupName}`}
      footer={
        <>
          <Button type="submit" form="move-group-form" isLoading={isSubmitting} variant="primary">
            Move
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <Form id="move-group-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Destination group" isRequired fieldId="destinationGroupName">
          <QueryState isLoading={groupsLoading} isError={groupsIsError} error={groupsError} onRetry={groupsRefetch}>
            <Controller
              name="destinationGroupName"
              control={control}
              render={({ field }) => (
                <DestinationDropdown
                  value={field.value}
                  onChange={field.onChange}
                  groups={destinationOptions}
                  isLoading={groupsLoading}
                  isError={Boolean(errors.destinationGroupName)}
                />
              )}
            />
            {errors.destinationGroupName && (
              <div className={styles.fieldError}>{errors.destinationGroupName.message}</div>
            )}
          </QueryState>
        </FormGroup>
      </Form>
    </Modal>
  );
}

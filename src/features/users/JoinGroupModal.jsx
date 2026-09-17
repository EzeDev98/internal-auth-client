import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Form, FormGroup, Alert,
  Dropdown, DropdownList, DropdownItem, MenuToggle, Spinner,
} from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { listGroups, addGroupMember } from '../groups/api';
import { joinGroupSchema } from './joinGroupSchema';
import styles from './JoinGroupModal.module.css';

// Same anchored PatternFly Dropdown/MenuToggle pattern as
// AssignRoleModal.jsx's own RoleDropdown - a native <select> popup can't
// be restyled, same reasoning documented there.
function GroupDropdown({
  value, onChange, groups, isLoading, isError,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = (groups ?? []).find((group) => group.groupName === value);
  const label = selected ? selected.groupName : (isLoading ? 'Loading...' : 'Select a group');

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          id="groupName"
          aria-label="Select a group"
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          isDisabled={isLoading}
          validated={isError ? 'error' : 'default'}
          className={styles.groupToggle}
        >
          {isLoading && <Spinner size="sm" style={{ marginInlineEnd: '8px' }} aria-hidden="true" />}
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

// Permission Groups tab "Join Group" button - existing POST
// /groups/{groupName}/users (PermissionController#addUsersToGroup), the
// same endpoint the group's own Members tab "Add member" action already
// calls (groups/AddMemberModal.jsx), just called from the user's side with
// username fixed and a group picked instead. Reuses groups/api.js's
// listGroups() (already unpaginated - same list groups/AssignRoleModal.jsx
// and GroupsListPage draw from) to populate the picker.
export default function JoinGroupModal({ username, onClose, onJoined }) {
  const [serverError, setServerError] = useState(null);

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups', 'for-user-join'],
    queryFn: listGroups,
  });

  const {
    handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(joinGroupSchema), defaultValues: { groupName: '' } });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await addGroupMember(values.groupName, { username });
      onJoined(values.groupName);
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Add ${username} to a permission group`}
      footer={(
        <>
          <Button type="submit" form="join-group-form" isLoading={isSubmitting} variant="primary">
            Add
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      )}
    >
      <Form id="join-group-form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Group" isRequired fieldId="groupName">
          <Controller
            name="groupName"
            control={control}
            render={({ field }) => (
              <GroupDropdown
                value={field.value}
                onChange={field.onChange}
                groups={groups}
                isLoading={groupsLoading}
                isError={Boolean(errors.groupName)}
              />
            )}
          />
          {errors.groupName && <div className={styles.fieldError}>{errors.groupName.message}</div>}
        </FormGroup>
      </Form>
    </Modal>
  );
}

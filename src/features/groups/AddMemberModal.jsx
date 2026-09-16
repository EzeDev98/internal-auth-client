import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Form, FormGroup, Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import { listUsers } from '../users/api';
import { addGroupMember } from './api';
import styles from './AddMemberModal.module.css';

// Members tab "Add member" button - existing POST /groups/{groupName}/users
// (PermissionController#addUsersToGroup) adds an existing user straight
// into the group (granting them every role already mapped to it), so this
// picks a user rather than creating one. Reuses the Users feature's own
// listUsers({ search }) - same search-by-username/phone/email the
// standalone Users list already supports - instead of a giant unpaginated
// dropdown, since the user list isn't bounded the way the roles list is
// (AssignRoleModal's FormSelect approach doesn't scale here).
export default function AddMemberModal({ groupName, onClose, onAdded }) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['users', 'for-group-add', search],
    queryFn: () => listUsers({ search, size: 8 }),
    enabled: Boolean(search),
  });

  const results = usersQuery.data?.content ?? [];

  const handleSearchSubmit = (value) => {
    setSearch(value.trim());
    setSelectedUsername(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUsername) return;
    setServerError(null);
    setIsSubmitting(true);
    try {
      await addGroupMember(groupName, { username: selectedUsername });
      onAdded();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Add member to ${groupName}`}
      footer={(
        <>
          <Button
            type="submit"
            form="add-member-form"
            isLoading={isSubmitting}
            isDisabled={!selectedUsername}
            variant="primary"
          >
            Add
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      )}
    >
      <Form id="add-member-form" onSubmit={handleSubmit}>
        {serverError && <Alert variant="danger" title={serverError} />}

        <FormGroup label="Username" isRequired fieldId="username-search">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearchSubmit}
            placeholder="Search by username, phone, or email"
            ariaLabel="Search users to add"
          />
        </FormGroup>

        {usersQuery.isLoading && <p className={styles.hint}>Searching...</p>}
        {usersQuery.isError && <p className={styles.hint}>{usersQuery.error.message}</p>}
        {search && !usersQuery.isLoading && !usersQuery.isError && results.length === 0 && (
          <p className={styles.hint}>{`No users found for "${search}".`}</p>
        )}

        {results.length > 0 && (
          <ul className={styles.resultsList}>
            {results.map((user) => (
              <li key={user.username}>
                <button
                  type="button"
                  className={[
                    styles.resultItem,
                    selectedUsername === user.username ? styles.resultItemSelected : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedUsername(user.username)}
                >
                  {user.username}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Form>
    </Modal>
  );
}

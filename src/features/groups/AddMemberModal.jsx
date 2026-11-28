// Modal for adding a user to a group.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Form, FormGroup, Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import { listUsers } from '../users/api';
import { addGroupMember } from './api';
import { useToast } from '../../shared/lib/useToast';
import styles from './AddMemberModal.module.css';

const CATALOG_SIZE = 50;

export default function AddMemberModal({ groupName, onClose, onAdded }) {
  const [searchInput, setSearchInput] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const toast = useToast();

  const trimmedSearch = searchInput.trim();
  const isSearching = Boolean(trimmedSearch);

  const {
    data: catalog, isLoading: catalogLoading, isError: catalogIsError, error: catalogError,
  } = useQuery({
    queryKey: ['users', 'catalog-for-group-add'],
    queryFn: () => listUsers({ size: CATALOG_SIZE }),
    enabled: isSearching,
  });

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const needle = trimmedSearch.toLowerCase();
    return (catalog?.content ?? []).filter((user) => user.username?.toLowerCase().includes(needle));
  }, [catalog, isSearching, trimmedSearch]);

  const closeConfirm = () => {
    if (isConfirming) return;
    setConfirmTarget(null);
    setConfirmError(null);
  };

  const handleConfirm = async () => {
    setConfirmError(null);
    setIsConfirming(true);
    try {
      await addGroupMember(groupName, { username: confirmTarget });
      toast.success(`Added ${confirmTarget} to "${groupName}".`);
      onAdded();
    } catch (err) {
      setConfirmError(err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={`Add member to ${groupName}`}
        footer={<Button variant="link" onClick={onClose}>Cancel</Button>}
      >
        <Form id="add-member-form" onSubmit={(event) => event.preventDefault()}>
          <FormGroup label="Username" isRequired fieldId="username-search">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={setSearchInput}
              placeholder="Search by username"
              ariaLabel="Search users to add"
            />

            {isSearching && (
              <div className={styles.resultsBox}>
                {catalogLoading && <p className={styles.hint}>Loading users...</p>}
                {!catalogLoading && catalogIsError && (
                  <p className={styles.hint}>{catalogError.message}</p>
                )}
                {!catalogLoading && !catalogIsError && searchResults.length === 0 && (
                  <p className={styles.hint}>{`No users found for "${trimmedSearch}".`}</p>
                )}
                {!catalogLoading && !catalogIsError && searchResults.length > 0 && (
                  <ul className={styles.resultsList}>
                    {searchResults.map((user) => (
                      <li key={user.username}>
                        <button
                          type="button"
                          className={styles.resultItem}
                          onClick={() => setConfirmTarget(user.username)}
                        >
                          {user.username}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </FormGroup>
        </Form>
      </Modal>

      {confirmTarget && (
        <Modal
          isOpen
          onClose={closeConfirm}
          title={`Add ${confirmTarget} to "${groupName}"?`}
          footer={(
            <>
              <Button variant="primary" isLoading={isConfirming} onClick={handleConfirm}>
                Add
              </Button>
              <Button variant="link" onClick={closeConfirm}>
                Cancel
              </Button>
            </>
          )}
        >
          {confirmError && <Alert variant="danger" title={confirmError} />}
          <p>{`This adds ${confirmTarget} to the "${groupName}" group.`}</p>
        </Modal>
      )}
    </>
  );
}

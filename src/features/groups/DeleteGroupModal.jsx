import { useState } from 'react';
import { Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { deleteSubgroup } from './api';
import styles from './DeleteGroupModal.module.css';

// UI-only for now, same as RenameGroupModal/MoveGroupModal - see the
// TODO(backend) note above deleteSubgroup in api.js. Unlike rename/move,
// the Java endpoint for this one already exists
// (DELETE /groups/{parentGroupName}/subgroups/{subGroupName} in
// PermissionController) - only the BFF proxy route is missing, so this is
// the one closest to actually working once that route is added. No form
// here, just a confirm/cancel choice - matches PatternFly's own delete
// confirmation pattern (danger-variant confirm button, no other fields).
export default function DeleteGroupModal({ parentGroupName, groupName, onClose, onDeleted }) {
  const [serverError, setServerError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setServerError(null);
    setIsDeleting(true);
    try {
      await deleteSubgroup(parentGroupName, groupName);
      onDeleted();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Delete ${groupName}?`}
      footer={
        <>
          <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      {serverError && <Alert variant="danger" title={serverError} className={styles.serverError} />}
      <p className={styles.body}>
        {`This will permanently delete "${groupName}" and remove any role mappings or members attached to it. `}
        This action cannot be undone.
      </p>
    </Modal>
  );
}

// Confirmation modal for deleting a group.
import { useState } from 'react';
import { Alert } from '@patternfly/react-core';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { deleteSubgroup } from './api';
import { useToast } from '../../shared/lib/useToast';
import styles from './DeleteGroupModal.module.css';

export default function DeleteGroupModal({ parentGroupName, groupName, onClose, onDeleted }) {
  const [serverError, setServerError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    setServerError(null);
    setIsDeleting(true);
    try {
      await deleteSubgroup(parentGroupName, groupName);
      toast.success(`Deleted "${groupName}".`);
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

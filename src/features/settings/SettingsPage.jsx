import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import { listSigningKeys, rotateSigningKey } from './api';
import styles from './SettingsPage.module.css';

const DASH = String.fromCharCode(8212);

const COLUMNS = [
  { key: 'kid', label: 'Key ID', render: (row) => row.kid ?? DASH },
  { key: 'status', label: 'Status', render: (row) => row.status ?? DASH },
  {
    key: 'current',
    label: 'Current',
    render: (row) => (row.current ? <Badge>Current</Badge> : DASH),
  },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : DASH),
  },
];

// Step 11A - Settings - Signing keys panel, replacing App.jsx's SettingsDemo
// placeholder. Backed by the new GET ${app.title}/admin/signing-keys for
// the current-key/history list (this feature's own api.js explains why
// that endpoint is additive) and the existing POST
// /admin/signing-keys/rotate for the action. Unpaginated - SigningKeyService
// #listKeys returns the server's full key history in one shot, not
// something with page/size params to forward - so DataTable is used here
// without its pagination props (its own onSetPage prop is optional).
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [rotateError, setRotateError] = useState(null);
  const [isRotating, setIsRotating] = useState(false);

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['signingKeys'],
    queryFn: listSigningKeys,
  });

  const keys = data ?? [];
  const currentKey = keys.find((key) => key.current);

  const closeConfirm = () => {
    if (isRotating) return;
    setIsConfirmOpen(false);
    setRotateError(null);
  };

  const confirmRotate = async () => {
    setRotateError(null);
    setIsRotating(true);
    try {
      await rotateSigningKey();
      setIsConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['signingKeys'] });
    } catch (err) {
      setRotateError(err.message);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Settings' }]} />
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.currentKeyRow}>
        <p className={styles.currentKeyLabel}>
          Current signing key:
          {' '}
          {currentKey ? <strong>{currentKey.kid}</strong> : DASH}
        </p>
        <Button variant="primary" onClick={() => setIsConfirmOpen(true)}>
          Rotate signing key
        </Button>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <DataTable
          ariaLabel="Signing keys"
          columns={COLUMNS}
          rows={keys}
          rowKey={(row) => row.kid}
          emptyStateMessage="No signing keys found."
        />
      </QueryState>

      {isConfirmOpen && (
        <Modal
          isOpen
          onClose={closeConfirm}
          title="Rotate signing key?"
          footer={
            <>
              <Button variant="danger" onClick={confirmRotate} isLoading={isRotating}>
                Rotate
              </Button>
              <Button variant="link" onClick={closeConfirm} isDisabled={isRotating}>
                Cancel
              </Button>
            </>
          }
        >
          {rotateError && <Alert variant="danger" title={rotateError} />}
          <p>
            This generates a new signing key and makes it current immediately. The previous key
            stays valid for verification during the grace period, so already-issued tokens won&apos;t
            break right away.
          </p>
        </Modal>
      )}
    </div>
  );
}

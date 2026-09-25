import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Checkbox, TextInput, Tooltip,
} from '@patternfly/react-core';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import { listSigningKeys, rotateSigningKey, wipeAll } from './api';
import { useToast } from '../../shared/lib/toastContext';
import styles from './SettingsPage.module.css';

const DASH = String.fromCharCode(8212);
const WIPE_ALL_CONFIRM_PHRASE = 'WIPE-EVERYTHING';

const COLUMNS = [
  { key: 'kid', label: 'Key ID', render: (row) => row.kid ?? DASH },
  { key: 'status', label: 'Status', render: (row) => row.status ?? DASH },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : DASH),
  },
  {
    key: 'retiredAt',
    label: 'Ended',
    render: (row) => (row.retiredAt ? new Date(row.retiredAt).toLocaleString() : DASH),
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
  const toast = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [rotateError, setRotateError] = useState(null);
  const [isRotating, setIsRotating] = useState(false);

  // Danger zone - "wipe everything" (SyncPoint + Notare + internal-auth).
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [includeSystemWallet, setIncludeSystemWallet] = useState(false);
  const [wipeError, setWipeError] = useState(null);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeResult, setWipeResult] = useState(null);

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
      toast.success('Signing key rotated');
      setIsConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['signingKeys'] });
    } catch (err) {
      setRotateError(err.message);
    } finally {
      setIsRotating(false);
    }
  };

  const closeWipeModal = () => {
    if (isWiping) return;
    setIsWipeModalOpen(false);
    setWipeConfirmText('');
    setIncludeSystemWallet(false);
    setWipeError(null);
    setWipeResult(null);
  };

  const confirmWipeAll = async () => {
    setWipeError(null);
    setIsWiping(true);
    try {
      const result = await wipeAll(wipeConfirmText, includeSystemWallet);
      setWipeResult(result);
    } catch (err) {
      setWipeError(err.message);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className={styles.pageBody}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.description}>
        {'Settings are server-wide configuration for this realm, including the signing key used to sign issued tokens. '}
        <a href="#" target="_blank" rel="noreferrer">Learn more</a>
      </p>

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
          isCompact
          emptyStateMessage="No signing keys found."
        />
      </QueryState>

      <div className={styles.dangerZoneTrigger}>
        <Tooltip
          content={(
            <>
              <strong>Danger zone</strong>
              <p className={styles.dangerZoneInfoText}>
                Wipes every user, session, and app-scoped record across SyncPoint, Notare, and
                internal-auth itself, not just this app. SyncPoint&apos;s and Notare&apos;s own
                admin wipe buttons keep working on their own - this is the one that runs all
                three together.
              </p>
            </>
          )}
        >
          <Button variant="danger" onClick={() => setIsWipeModalOpen(true)}>
            Wipe everything
          </Button>
        </Tooltip>
      </div>

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

      {isWipeModalOpen && (
        <Modal
          isOpen
          onClose={closeWipeModal}
          title="Wipe everything?"
          footer={wipeResult ? (
            <Button variant="primary" onClick={closeWipeModal}>Close</Button>
          ) : (
            <>
              <Button
                variant="danger"
                onClick={confirmWipeAll}
                isLoading={isWiping}
                isDisabled={wipeConfirmText !== WIPE_ALL_CONFIRM_PHRASE}
              >
                Wipe everything
              </Button>
              <Button variant="link" onClick={closeWipeModal} isDisabled={isWiping}>
                Cancel
              </Button>
            </>
          )}
        >
          {wipeError && <Alert variant="danger" title={wipeError} />}

          {!wipeResult && (
            <>
              <p>
                Calls SyncPoint&apos;s and Notare&apos;s own wipe endpoints, then internal-auth&apos;s
                own data, in that order - stopping immediately if any step fails. Neither
                app&apos;s own wipe endpoint is changed by this; they stay callable on their own.
                There is no undo.
              </p>
              <Checkbox
                id="wipe-all-include-system-wallet"
                label="Also wipe SyncPoint's system wallet"
                isChecked={includeSystemWallet}
                onChange={(_event, checked) => setIncludeSystemWallet(checked)}
              />
              <p className={styles.dangerZoneDescription}>
                {`Type ${WIPE_ALL_CONFIRM_PHRASE} to confirm.`}
              </p>
              <TextInput
                id="wipe-all-confirm-text"
                aria-label="Confirmation phrase"
                value={wipeConfirmText}
                onChange={(_event, value) => setWipeConfirmText(value)}
                placeholder={WIPE_ALL_CONFIRM_PHRASE}
                className={styles.wipeConfirmInput}
              />
            </>
          )}

          {wipeResult && (
            <ul className={styles.stepList}>
              {wipeResult.steps.map((step) => (
                <li
                  key={step.service}
                  className={step.success ? styles.stepSuccess : styles.stepFailure}
                >
                  <strong>{step.service}</strong>
                  {': '}
                  {step.message ?? (step.success ? 'Wiped successfully.' : 'Failed.')}
                </li>
              ))}
              {!wipeResult.completedFully && (
                <li className={styles.stepFailure}>
                  Stopped after the failure above - later steps were not attempted.
                </li>
              )}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}

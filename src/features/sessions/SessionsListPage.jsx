import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TextInput, FormSelect, FormSelectOption, Alert } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import ActionsMenu from '../../shared/components/ActionsMenu';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { listSessions, revokeSession } from './api';
import styles from './SessionsListPage.module.css';

const DASH = String.fromCharCode(8212);

const COLUMNS = [
  { key: 'username', label: 'Username', render: (row) => row.username ?? DASH },
  { key: 'ipAddress', label: 'IP address', render: (row) => row.ipAddress ?? DASH },
  { key: 'device', label: 'Device', render: (row) => row.device ?? DASH },
  { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
  {
    key: 'createdAt',
    label: 'Started',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : DASH),
  },
  {
    key: 'endedAt',
    label: 'Ended',
    render: (row) => (row.endedAt ? new Date(row.endedAt).toLocaleString() : DASH),
  },
  { key: 'endReason', label: 'End reason', render: (row) => row.endReason ?? DASH },
];

// Step 10A - standalone list, backed by Step 2E's GET /admin/sessions
// (already built, and already used by the Users - Detail Sessions tab
// per UserSessionController's own Javadoc) - this screen calls it with no
// username/clientId filter, unlike that tab. ipAddress/device match as a
// substring server-side (per the endpoint's own description), so each
// gets its own debounced text filter rather than one combined search box.
//
// Step 10B - Revoke, via Step 4E's single ActionsMenu pattern. The real
// upstream endpoint (UserSessionController#invalidateSession) closes a
// user's one active session, not a specific session id - so "Revoke" is
// disabled for any row that's already inactive, same intent either way.
// It's also disabled if clientId couldn't be resolved server-side
// (AdminSessionSummaryResponse's clientId is best-effort - see
// SessionManagementServiceImpl#resolveClientId) since the upstream call
// requires it. Confirmation reuses the shared Modal primitive exactly as
// its own Step 4E docblock intends ("confirmation dialogs, simple forms").
export default function SessionsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [ipInput, setIpInput] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [deviceInput, setDeviceInput] = useState('');
  const [device, setDevice] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null); // null | { username, clientId }
  const [revokeError, setRevokeError] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIpAddress(ipInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [ipInput]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDevice(deviceInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [deviceInput]);

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['sessions', page, perPage, ipAddress, device, activeFilter],
    queryFn: () => listSessions({
      page: page - 1,
      size: perPage,
      ipAddress: ipAddress || undefined,
      device: device || undefined,
      active: activeFilter === '' ? undefined : activeFilter === 'true',
    }),
  });

  const rows = data?.content ?? [];
  const itemCount = data?.totalElements ?? 0;

  const closeRevoke = () => {
    if (isRevoking) return;
    setRevokeTarget(null);
    setRevokeError(null);
  };

  const confirmRevoke = async () => {
    setRevokeError(null);
    setIsRevoking(true);
    try {
      await revokeSession(revokeTarget);
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (err) {
      setRevokeError(err.message);
    } finally {
      setIsRevoking(false);
    }
  };

  const columns = [
    ...COLUMNS,
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <ActionsMenu
          ariaLabel={`Actions for ${row.username ?? 'session'}`}
          items={[
            {
              key: 'revoke',
              label: 'Revoke',
              isDanger: true,
              isDisabled: !row.active || !row.clientId,
              onClick: () => setRevokeTarget({ username: row.username, clientId: row.clientId }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Sessions' }]} />
      <h1 className={styles.title}>Sessions</h1>

      <div className={styles.filters}>
        <TextInput
          aria-label="Filter by IP address"
          placeholder="IP address"
          value={ipInput}
          onChange={(_event, value) => setIpInput(value)}
          className={styles.searchInput}
        />
        <TextInput
          aria-label="Filter by device"
          placeholder="Device"
          value={deviceInput}
          onChange={(_event, value) => setDeviceInput(value)}
          className={styles.searchInput}
        />
        <FormSelect
          aria-label="Filter by active status"
          value={activeFilter}
          onChange={(_event, value) => {
            setActiveFilter(value);
            setPage(1);
          }}
          className={styles.statusSelect}
        >
          <FormSelectOption value="" label="All sessions" />
          <FormSelectOption value="true" label="Active" />
          <FormSelectOption value="false" label="Ended" />
        </FormSelect>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <DataTable
          ariaLabel="Sessions"
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          page={page}
          perPage={perPage}
          itemCount={itemCount}
          onSetPage={(_event, newPage) => setPage(newPage)}
          onPerPageSelect={(_event, newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          emptyStateMessage="No sessions found."
        />
      </QueryState>

      {revokeTarget && (
        <Modal
          isOpen
          onClose={closeRevoke}
          title="Revoke session"
          footer={
            <>
              <Button variant="danger" onClick={confirmRevoke} isLoading={isRevoking}>
                Revoke
              </Button>
              <Button variant="link" onClick={closeRevoke} isDisabled={isRevoking}>
                Cancel
              </Button>
            </>
          }
        >
          {revokeError && <Alert variant="danger" title={revokeError} />}
          <p>
            This will force-log-out
            {' '}
            <strong>{revokeTarget.username}</strong>
            {' '}
            by ending their active session. They&apos;ll need to sign in again.
          </p>
        </Modal>
      )}
    </div>
  );
}

// Paged list of user sessions with filtering and revoke actions.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Dropdown, DropdownList, DropdownItem, MenuToggle,
} from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import useDebouncedSearch from '../../shared/hooks/useDebouncedSearch';
import { listSessions, revokeSession, revokeAllSessions } from './api';
import { useToast } from '../../shared/lib/useToast';
import styles from './SessionsListPage.module.css';

const DASH = String.fromCharCode(8212);

const SESSION_STATUS_OPTIONS = [
  { value: '', label: 'All sessions' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Ended' },
];

function SessionStatusFilterDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = SESSION_STATUS_OPTIONS.find((option) => option.value === value)
    ?? SESSION_STATUS_OPTIONS[0];

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="Filter by session status"
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          className={styles.statusToggle}
        >
          {selected.label}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {SESSION_STATUS_OPTIONS.map((option) => (
          <DropdownItem
            key={option.value}
            icon={option.value === value ? <CheckIcon /> : <span className={styles.checkPlaceholder} />}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

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

export default function SessionsListPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [activeFilter, setActiveFilter] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeError, setRevokeError] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);
  const [revokeAllError, setRevokeAllError] = useState(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const {
    searchInput, setSearchInput, search, handleSearchSubmit,
  } = useDebouncedSearch();

  const [pagedSearch, setPagedSearch] = useState(search);
  if (search !== pagedSearch) {
    setPagedSearch(search);
    setPage(1);
  }

  const isIpLike = /^[0-9a-fA-F:.]+$/.test(search);

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['sessions', page, perPage, search, activeFilter],
    queryFn: () => listSessions({
      page: page - 1,
      size: perPage,
      ipAddress: search && isIpLike ? search : undefined,
      device: search && !isIpLike ? search : undefined,
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
      toast.success(`Revoked ${revokeTarget.username}'s session.`);
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (err) {
      setRevokeError(err.message);
    } finally {
      setIsRevoking(false);
    }
  };

  const closeRevokeAll = () => {
    if (isRevokingAll) return;
    setIsRevokeAllOpen(false);
    setRevokeAllError(null);
  };

  const confirmRevokeAll = async () => {
    setRevokeAllError(null);
    setIsRevokingAll(true);
    try {
      const { attempted, failures } = await revokeAllSessions({
        ipAddress: search && isIpLike ? search : undefined,
        device: search && !isIpLike ? search : undefined,
      });
      if (failures.length > 0) {
        setRevokeAllError(
          attempted === failures.length
            ? 'Could not revoke any sessions. Please try again.'
            : `Revoked ${attempted - failures.length} of ${attempted} sessions - ${failures.length} failed.`,
        );
      } else {
        toast.success(`Revoked ${attempted} session${attempted === 1 ? '' : 's'}.`);
        setIsRevokeAllOpen(false);
      }
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (err) {
      setRevokeAllError(err.message);
    } finally {
      setIsRevokingAll(false);
    }
  };

  const columns = [
    ...COLUMNS,
    {
      key: 'actions',
      label: '',
      isAction: true,
      render: (row) => (
        <Button
          variant="danger"
          size="sm"
          isDisabled={!row.active || !row.clientId}
          onClick={() => setRevokeTarget({ username: row.username, clientId: row.clientId })}
        >
          Revoke
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.pageBody}>
      <h1 className={styles.title}>Sessions</h1>
      <p className={styles.description}>
        {'Sessions are sessions of users and the clients that they access within the session. '}
        <a href="#" target="_blank" rel="noreferrer">Learn more</a>
      </p>

      <div className={styles.filters}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
          placeholder="Search by IP address or device"
          ariaLabel="Search sessions"
          className={styles.searchBar}
        />
        <SessionStatusFilterDropdown
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
        />
        <Button
          variant="danger"
          className={styles.revokeAllButton}
          onClick={() => setIsRevokeAllOpen(true)}
        >
          Revoke all sessions
        </Button>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <DataTable
          ariaLabel="Sessions"
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          isCompact
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

      {isRevokeAllOpen && (
        <Modal
          isOpen
          onClose={closeRevokeAll}
          title="Revoke all sessions"
          footer={
            <>
              <Button variant="danger" onClick={confirmRevokeAll} isLoading={isRevokingAll}>
                Revoke all
              </Button>
              <Button variant="link" onClick={closeRevokeAll} isDisabled={isRevokingAll}>
                Cancel
              </Button>
            </>
          }
        >
          {revokeAllError && <Alert variant="danger" title={revokeAllError} />}
          <p>
            This will force-log-out every user with an active session
            {search ? ' matching your current search' : ''}
            . They&apos;ll all need to sign in again. This can&apos;t be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

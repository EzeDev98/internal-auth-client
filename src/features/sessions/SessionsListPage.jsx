import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Dropdown, DropdownList, DropdownItem, MenuToggle,
} from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import ActionsMenu from '../../shared/components/ActionsMenu';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import useDebouncedSearch from '../../shared/hooks/useDebouncedSearch';
import { listSessions, revokeSession, revokeAllSessions } from './api';
import styles from './SessionsListPage.module.css';

const DASH = String.fromCharCode(8212);

const SESSION_STATUS_OPTIONS = [
  { value: '', label: 'All sessions' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Ended' },
];

// Same Dropdown/MenuToggle pattern as UsersListPage's StatusFilterDropdown
// (a real anchored popper instead of a native <select>, styled to match
// SearchBar's box) so the two list screens' status filters look and
// behave identically.
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
  const [activeFilter, setActiveFilter] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null); // null | { username, clientId }
  const [revokeError, setRevokeError] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);
  const [revokeAllError, setRevokeAllError] = useState(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Live-as-you-type: searchInput updates every keystroke for the SearchBar,
  // `search` only settles 400ms after typing stops so ipAddress/device
  // filtering (a real network request) doesn't fire on every keystroke -
  // now shared via useDebouncedSearch instead of a hand-rolled setTimeout
  // effect. handleSearchSubmit still commits immediately on Enter/arrow-click.
  const {
    searchInput, setSearchInput, search, handleSearchSubmit,
  } = useDebouncedSearch();

  // Reset to page 1 whenever the committed search term changes, whether
  // that came from the debounce settling or an explicit submit.
  useEffect(() => {
    setPage(1);
  }, [search]);

  // The endpoint still only takes ipAddress and device as two separate
  // substring filters, ANDed together server-side - so sending one typed
  // term to both would break device search (an IP never contains e.g.
  // "axios"). Instead, route the term to whichever field it looks like:
  // IPv4/IPv6 characters only -> ipAddress, anything else -> device.
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

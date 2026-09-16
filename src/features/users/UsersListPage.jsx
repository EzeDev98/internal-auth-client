import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dropdown, DropdownList, DropdownItem, MenuToggle,
} from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import { listUsers } from './api';
import styles from './UsersListPage.module.css';

const COLUMNS = [
  {
    key: 'username',
    label: 'Username',
    render: (row) => (
      <Link to={`/users/${encodeURIComponent(row.username)}?clientId=${encodeURIComponent(row.clientId ?? '')}`}>
        {row.username}
      </Link>
    ),
  },
  { key: 'email', label: 'Email', render: (row) => row.email ?? '—' },
  { key: 'phoneNumber', label: 'Phone', render: (row) => row.phoneNumber ?? '—' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Badge className={row.enabled ? styles.statusEnabled : styles.statusDisabled}>
        {row.enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    ),
  },
  { key: 'mfaEnabled', label: 'MFA', render: (row) => (row.mfaEnabled ? 'Yes' : 'No') },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
  },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
];

// A real anchored PatternFly Dropdown/MenuToggle instead of a native
// <select> (same primitives ActionsMenu.jsx already uses) - a native
// select's popup is rendered by the OS/browser, not by us, which is why
// it couldn't be resized, restyled, or reliably aligned to the toggle.
// This one opens as a normal popper directly under its toggle, and the
// toggle itself is styled in UsersListPage.module.css to match
// SearchBar's box (same height/border/radius) so the two sit as one
// visual unit.
function StatusFilterDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[0];

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="Filter by enabled status"
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          className={styles.statusToggle}
        >
          {selected.label}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {STATUS_OPTIONS.map((option) => (
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

// Step 7A - list, backed by Step 2A's GET /users (which, like Steps 2B/2E,
// already existed on the server despite the plan marking it "Needed").
// search matches username/phone/email and enabled filters status, exactly
// mirroring AdminUserController's own documented filters - no client
// filter here since it's optional upstream and each row already carries
// its own clientId (a Step 7A backend addition) for the detail link.
export default function UsersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState('');

  const handleSearchSubmit = (value) => {
    setSearch(value.trim());
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setEnabledFilter(value);
    setPage(1);
  };

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', page, perPage, search, enabledFilter],
    queryFn: () => listUsers({
      page: page - 1,
      size: perPage,
      search: search || undefined,
      enabled: enabledFilter === '' ? undefined : enabledFilter === 'true',
    }),
  });

  const rows = data?.content ?? [];
  const itemCount = data?.totalElements ?? 0;

  return (
    <div className={styles.pageBody}>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.description}>
            {'Manage the users who can access your organization. '}
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>

      <div className={styles.filters}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
          placeholder="Search by username, phone, or email"
          ariaLabel="Search users"
          className={styles.searchBar}
        />
        <StatusFilterDropdown value={enabledFilter} onChange={handleStatusChange} />
        <Button variant="primary" onClick={() => navigate('/users/create')}>
          Create user
        </Button>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <DataTable
          ariaLabel="Users"
          columns={COLUMNS}
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
          emptyStateMessage="No users found."
        />
      </QueryState>

    </div>
  );
}

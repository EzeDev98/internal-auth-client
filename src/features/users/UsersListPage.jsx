// Paged, searchable list of users.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Dropdown, DropdownList, DropdownItem, MenuToggle,
} from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import useDebouncedSearch from '../../shared/hooks/useDebouncedSearch';
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
  { key: 'clientId', label: 'App', render: (row) => row.clientId ?? '—' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Badge className={row.enabled ? styles.statusEnabled : styles.statusDisabled}>
        {row.enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    ),
  },
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

export default function UsersListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [enabledFilter, setEnabledFilter] = useState('');

  const {
    searchInput, setSearchInput, search, handleSearchSubmit,
  } = useDebouncedSearch();

  const [pagedSearch, setPagedSearch] = useState(search);
  if (search !== pagedSearch) {
    setPagedSearch(search);
    setPage(1);
  }

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
          isCompact
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

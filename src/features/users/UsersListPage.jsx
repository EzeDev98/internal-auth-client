import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TextInput, FormSelect, FormSelectOption } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Button from '../../shared/components/Button';
import CreateUserModal from './CreateUserModal';
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
  { key: 'enabled', label: 'Enabled', render: (row) => (row.enabled ? 'Yes' : 'No') },
  { key: 'mfaEnabled', label: 'MFA', render: (row) => (row.mfaEnabled ? 'Yes' : 'No') },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
  },
];

// Step 7A - list, backed by Step 2A's GET /users (which, like Steps 2B/2E,
// already existed on the server despite the plan marking it "Needed").
// search matches username/phone/email and enabled filters status, exactly
// mirroring AdminUserController's own documented filters - no client
// filter here since it's optional upstream and each row already carries
// its own clientId (a Step 7A backend addition) for the detail link.
export default function UsersListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

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

  const handleCreated = () => {
    setIsCreateOpen(false);
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Users' }]} />

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Users</h1>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          Create user
        </Button>
      </div>

      <div className={styles.filters}>
        <TextInput
          aria-label="Search users"
          placeholder="Search by username, phone, or email"
          value={searchInput}
          onChange={(_event, value) => setSearchInput(value)}
          className={styles.searchInput}
        />
        <FormSelect
          aria-label="Filter by enabled status"
          value={enabledFilter}
          onChange={(_event, value) => {
            setEnabledFilter(value);
            setPage(1);
          }}
          className={styles.statusSelect}
        >
          <FormSelectOption value="" label="All statuses" />
          <FormSelectOption value="true" label="Enabled" />
          <FormSelectOption value="false" label="Disabled" />
        </FormSelect>
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

      {isCreateOpen && (
        <CreateUserModal onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

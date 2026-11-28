// Searchable list of roles.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import useClientSideSearch from '../../shared/hooks/useClientSideSearch';
import { listRoles } from './api';
import styles from './RolesListPage.module.css';

const matchRoleRow = (row, needle) => row.roleName?.toLowerCase().includes(needle);

const COLUMNS = [
  {
    key: 'roleName',
    label: 'Role name',
    width: 20,
    modifier: 'nowrap',
    render: (row) => <Link to={`/roles/${row.id}`}>{row.roleName}</Link>,
  },
  { key: 'description', label: 'Description', modifier: 'truncate', render: (row) => row.description || '—' },
  {
    key: 'scope',
    label: 'Scope',
    width: 15,
    modifier: 'nowrap',
    render: (row) => (row.clientApplicationId == null ? 'Global' : `Client #${row.clientApplicationId}`),
  },
  {
    key: 'createdAt',
    label: 'Created',
    width: 15,
    modifier: 'nowrap',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
  },
];

export default function RolesListPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  });

  const rows = data ?? [];

  const filteredRows = useClientSideSearch(rows, searchInput, matchRoleRow);

  return (
    <div className={styles.pageBody}>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.title}>Roles</h1>
          <p className={styles.description}>
            {'Roles are the roles that you define for use across your organization. '}
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

      <div className={styles.actionsRow}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search role by name"
          ariaLabel="Search role by name"
          className={styles.searchBar}
        />

        <Button variant="primary" onClick={() => navigate('/roles/create')}>
          Create role
        </Button>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <DataTable
          ariaLabel="Roles"
          columns={COLUMNS}
          rows={filteredRows}
          rowKey={(row) => row.id}
          isCompact
          isSearching={Boolean(searchInput.trim())}
          emptyStateMessage="No roles found."
        />
      </QueryState>
    </div>
  );
}

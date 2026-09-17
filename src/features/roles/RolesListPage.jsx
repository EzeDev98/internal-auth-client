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

// Name only, same match rule as GroupsListPage/ClientsListPage - previously
// this also matched `description`, which let "user" surface create-admin
// (its description mentions "manage users") alongside user_role.
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

// Step 8A - list, backed by Step 2C's GET /roles. Investigated directly
// against PermissionController rather than trusting the plan's "Needed"
// marking - same pattern as Step 2's other endpoints: it, and GET
// /roles/{id}, already exist (RoleQueryService/RoleQueryServiceImpl), both
// commented as "Step 2C" in that source. listRoles() returns every role
// unpaginated (plain findAll()), so no Pagination controls here, unlike
// ClientsListPage/UsersListPage. Step 8B added the create modal (now Step
// 13A's CreateRolePage replaces it); Step 8C added the Role name column's
// link to the detail page below.
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

  // listRoles() returns every role unpaginated, so like ClientsListPage
  // this filters the already-loaded list client-side by name rather than
  // querying the server. Filters live on every keystroke (searchInput)
  // rather than waiting for submit - same reasoning as ClientsListPage's
  // own live-filter fix. Filtering itself now lives in the shared
  // useClientSideSearch hook.
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

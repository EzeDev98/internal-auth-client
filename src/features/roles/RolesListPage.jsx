import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import CreateRoleModal from './CreateRoleModal';
import { listRoles } from './api';
import styles from './RolesListPage.module.css';

const COLUMNS = [
  { key: 'roleName', label: 'Role name', render: (row) => <Link to={`/roles/${row.id}`}>{row.roleName}</Link> },
  { key: 'description', label: 'Description', render: (row) => row.description || '—' },
  {
    key: 'scope',
    label: 'Scope',
    render: (row) => (
      <Badge>{row.clientApplicationId == null ? 'Global' : `Client #${row.clientApplicationId}`}</Badge>
    ),
  },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
  },
];

// Step 8A - list, backed by Step 2C's GET /roles. Investigated directly
// against PermissionController rather than trusting the plan's "Needed"
// marking - same pattern as Step 2's other endpoints: it, and GET
// /roles/{id}, already exist (RoleQueryService/RoleQueryServiceImpl), both
// commented as "Step 2C" in that source. listRoles() returns every role
// unpaginated (plain findAll()), so no Pagination controls here, unlike
// ClientsListPage/UsersListPage. Step 8B added the create modal; Step 8C
// added the Role name column's link to the detail page below.
export default function RolesListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  });

  const rows = data ?? [];

  const handleCreated = () => {
    setIsCreateOpen(false);
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Roles' }]} />

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Roles</h1>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          Create role
        </Button>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <DataTable
          ariaLabel="Roles"
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          emptyStateMessage="No roles found."
        />
      </QueryState>

      {isCreateOpen && (
        <CreateRoleModal onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import CreateClientModal from './CreateClientModal';
import { listClients } from './api';
import styles from './ClientsListPage.module.css';

const COLUMNS = [
  {
    key: 'clientId',
    label: 'Client ID',
    render: (row) => <Link to={`/clients/${encodeURIComponent(row.clientId)}`}>{row.clientId}</Link>,
  },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', render: (row) => <Badge>{row.type}</Badge> },
  { key: 'enabled', label: 'Enabled', render: (row) => (row.enabled ? 'Yes' : 'No') },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
  },
];

// Step 6A - list, backed by Step 2B's GET /client-applications (which
// already existed on the server despite the plan marking it "Needed" -
// confirmed by reading ClientApplicationController directly). The Client ID
// column links to Step 6C's detail/edit page. Column sort isn't wired to
// the backend yet, so no column here claims to be sortable.
export default function ClientsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['clients', page, perPage],
    queryFn: () => listClients({ page: page - 1, size: perPage }),
  });

  const rows = data?.content ?? [];
  const itemCount = data?.totalElements ?? 0;

  const handleCreated = () => {
    setIsCreateOpen(false);
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Clients' }]} />

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Client applications</h1>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          Create client
        </Button>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <DataTable
          ariaLabel="Client applications"
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
          emptyStateMessage="No client applications found."
        />
      </QueryState>

      {isCreateOpen && (
        <CreateClientModal onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

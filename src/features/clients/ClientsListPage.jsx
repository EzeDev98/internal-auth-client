// Paged, searchable list of client applications.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import useClientSideSearch from '../../shared/hooks/useClientSideSearch';
import { listClients } from './api';
import styles from './ClientsListPage.module.css';

const matchClientRow = (row, needle) => (
  row.clientId?.toLowerCase().includes(needle) || row.name?.toLowerCase().includes(needle)
);

const COLUMNS = [
  {
    key: 'clientId',
    label: 'Client ID',
    render: (row) => <Link to={`/clients/${encodeURIComponent(row.clientId)}`}>{row.clientId}</Link>,
  },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', render: (row) => <Badge className={styles.typeBadge}>{row.type}</Badge> },
  { key: 'enabled', label: 'Enabled', render: (row) => (row.enabled ? 'Yes' : 'No') },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
  },
];

export default function ClientsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['clients', page, perPage],
    queryFn: () => listClients({ page: page - 1, size: perPage }),
  });

  const rows = data?.content ?? [];
  const itemCount = data?.totalElements ?? 0;

  const filteredRows = useClientSideSearch(rows, searchInput, matchClientRow);

  return (
    <div className={styles.pageBody}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Clients</h1>
      </div>

      <div className={styles.actionsRow}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search for client"
          ariaLabel="Search for client"
          className={styles.searchBar}
        />

        <Button variant="primary" onClick={() => navigate('/clients/create')}>
          Create client
        </Button>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <DataTable
          ariaLabel="Clients"
          columns={COLUMNS}
          rows={filteredRows}
          rowKey={(row) => row.id}
          isCompact
          isSearching={Boolean(searchInput.trim())}
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
    </div>
  );
}

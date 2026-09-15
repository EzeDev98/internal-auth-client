import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import { listClients } from './api';
import styles from './ClientsListPage.module.css';

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

// Step 6A - list, backed by Step 2B's GET /client-applications (which
// already existed on the server despite the plan marking it "Needed" -
// confirmed by reading ClientApplicationController directly). The Client ID
// column links to Step 6C's detail/edit page. Column sort isn't wired to
// the backend yet, so no column here claims to be sortable.
export default function ClientsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['clients', page, perPage],
    queryFn: () => listClients({ page: page - 1, size: perPage }),
  });

  const rows = data?.content ?? [];
  const itemCount = data?.totalElements ?? 0;

  // The clients endpoint has no search param on the backend (unlike
  // /users), so this filters the currently loaded page client-side by
  // clientId/name rather than querying the server.
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const needle = search.toLowerCase();
    return rows.filter(
      (row) => row.clientId?.toLowerCase().includes(needle) || row.name?.toLowerCase().includes(needle),
    );
  }, [rows, search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className={styles.pageBody}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Clients</h1>
      </div>

      <div className={styles.actionsRow}>
        <form className={styles.searchGroup} role="search" onSubmit={handleSearchSubmit}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="text"
            className={styles.searchField}
            placeholder="Search for client"
            aria-label="Search for client"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className={styles.searchSubmit} aria-label="Submit search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

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

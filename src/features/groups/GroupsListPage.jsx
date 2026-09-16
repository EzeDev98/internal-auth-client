import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import ActionsMenu from '../../shared/components/ActionsMenu';
import AssignRoleModal from './AssignRoleModal';
import { listGroups } from './api';
import styles from './GroupsListPage.module.css';

export default function GroupsListPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [assignRoleTarget, setAssignRoleTarget] = useState(null); // null | { groupName }

  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: listGroups });
  const rows = groupsQuery.data ?? [];

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const needle = search.toLowerCase();
    return rows.filter((row) => row.groupName?.toLowerCase().includes(needle));
  }, [rows, search]);

  const columns = useMemo(
    () => [
      {
        key: 'groupName',
        label: 'Group name',
        render: (row) => <Link to={`/groups/${row.id}`}>{row.groupName}</Link>,
      },
      {
        key: 'actions',
        label: '',
        width: 10,
        isAction: true,
        render: (row) => (
          <ActionsMenu
            ariaLabel={`Actions for ${row.groupName}`}
            items={[
              {
                key: 'assign-role',
                label: 'Assign role',
                onClick: () => setAssignRoleTarget({ groupName: row.groupName }),
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  const handleSearchSubmit = (value) => {
    setSearch(value.trim());
  };

  return (
    <div className={styles.pageBody}>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.title}>Groups</h1>
          <p className={styles.description}>
            {'A group is a set of attributes and role mappings that can be applied to a user. '}
            {'You can create, edit, and delete groups and manage their child-parent organization. '}
            <a href="#" target="_blank" rel="noreferrer">
              Learn more
            </a>
          </p>
        </div>
      </div>

      <div className={styles.actionsRow}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
          placeholder="Filter groups"
          ariaLabel="Filter groups"
        />

        <Button variant="primary" onClick={() => navigate('/groups/create')}>
          Create group
        </Button>
      </div>

      <QueryState
        isLoading={groupsQuery.isLoading}
        isError={groupsQuery.isError}
        error={groupsQuery.error}
        onRetry={groupsQuery.refetch}
      >
        <DataTable
          ariaLabel="Groups"
          columns={columns}
          rows={filteredRows}
          rowKey={(row) => row.id}
          emptyStateMessage="No groups found."
          isCompact
        />
      </QueryState>

      {assignRoleTarget && (
        <AssignRoleModal
          target={assignRoleTarget}
          onClose={() => setAssignRoleTarget(null)}
          onAssigned={() => setAssignRoleTarget(null)}
        />
      )}
    </div>
  );
}

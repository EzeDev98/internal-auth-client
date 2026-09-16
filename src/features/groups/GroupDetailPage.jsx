import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Button from '../../shared/components/Button';
import SearchBar from '../../shared/components/SearchBar';
import DataTable from '../../shared/components/DataTable';
import Tabs from '../../shared/components/Tabs';
import QueryState from '../../shared/components/QueryState';
import ActionsMenu from '../../shared/components/ActionsMenu';
import EmptyState from '../../shared/components/EmptyState';
import CreateGroupModal from './CreateGroupModal';
import AssignRoleModal from './AssignRoleModal';
import RenameGroupModal from './RenameGroupModal';
import MoveGroupModal from './MoveGroupModal';
import DeleteGroupModal from './DeleteGroupModal';
import AddMemberModal from './AddMemberModal';
import { listGroups, listSubgroups, getGroup } from './api';
import styles from './GroupDetailPage.module.css';

const CHILD_GROUP_COLUMNS = [
  { key: 'groupName', label: 'Group name' },
  { key: 'description', label: 'Description', render: (row) => row.description || '—' },
];
const MEMBER_COLUMNS = [
  { key: 'username', label: 'Username', render: (row) => row.username || '—' },
  { key: 'email', label: 'Email', render: (row) => row.email || '—' },
  {
    key: 'membership', label: 'Membership', modifier: 'wrap', render: (row) => row.membership || '—',
  },
];
const ROLE_COLUMNS = [
  { key: 'roleName', label: 'Name', render: (row) => row.roleName },
  { key: 'description', label: 'Description', render: (row) => row.description || '—' },
];

// Matches Keycloak's own group detail screen (Child groups / Members /
// Role mapping tabs), reusing the same Tabs and DataTable components
// already built for RoleDetailPage/GroupsListPage rather than
// hand-rolling new layout. No Attributes tab, same reasoning as
// RoleDetailPage: nothing in this app's group model maps to it.
// Child groups still comes from GET /groups/{id}/subgroups; Members and
// Role mapping are backed by the single GET /groups/{groupName} call
// (GroupResponse's userResponses/roles).
//
// Each tab now owns its own action row (search + primary action), matching
// Keycloak's per-tab toolbars, instead of one shared "Assign role"/"Create
// child group" pair sitting in the page header regardless of which tab is
// open - the search bars filter that tab's own rows client-side, the same
// pattern GroupsListPage/RolesListPage/ClientsListPage already use.
export default function GroupDetailPage() {
  const { id } = useParams();
  const groupId = Number(id);
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: listGroups });
  const group = (groupsQuery.data ?? []).find((g) => g.id === groupId);

  const subgroupsQuery = useQuery({
    queryKey: ['groups', groupId, 'subgroups'],
    queryFn: () => listSubgroups(groupId),
    enabled: Number.isFinite(groupId),
  });

  const groupDetailQuery = useQuery({
    queryKey: ['groups', 'by-name', group?.groupName],
    queryFn: () => getGroup(group.groupName),
    enabled: Boolean(group?.groupName),
  });

  const [createSubgroupOpen, setCreateSubgroupOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [assignRoleTarget, setAssignRoleTarget] = useState(null); // null | { groupName } | { parentGroupName, subGroupName }
  const [renameTarget, setRenameTarget] = useState(null); // null | { parentGroupName, groupName }
  const [moveTarget, setMoveTarget] = useState(null); // null | { parentGroupName, groupName }
  const [deleteTarget, setDeleteTarget] = useState(null); // null | { parentGroupName, groupName }

  const [childGroupSearchInput, setChildGroupSearchInput] = useState('');
  const [childGroupSearch, setChildGroupSearch] = useState('');
  const [roleSearchInput, setRoleSearchInput] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  const subgroups = subgroupsQuery.data ?? [];
  const members = groupDetailQuery.data?.userResponses ?? [];
  const roles = groupDetailQuery.data?.roles ?? [];

  const filteredSubgroups = useMemo(() => {
    if (!childGroupSearch) return subgroups;
    const needle = childGroupSearch.toLowerCase();
    return subgroups.filter((row) => row.groupName?.toLowerCase().includes(needle));
  }, [subgroups, childGroupSearch]);

  const filteredRoles = useMemo(() => {
    if (!roleSearch) return roles;
    const needle = roleSearch.toLowerCase();
    return roles.filter((row) => row.roleName?.toLowerCase().includes(needle));
  }, [roles, roleSearch]);

  const childGroupColumns = useMemo(
    () => [
      ...CHILD_GROUP_COLUMNS,
      {
        key: 'actions',
        label: '',
        isAction: true,
        render: (row) => (
          <ActionsMenu
            ariaLabel={`Actions for ${row.groupName}`}
            items={[
              {
                key: 'assign-role',
                label: 'Assign role',
                onClick: () =>
                  group && setAssignRoleTarget({ parentGroupName: group.groupName, subGroupName: row.groupName }),
              },
              {
                key: 'rename',
                label: 'Rename',
                onClick: () =>
                  group && setRenameTarget({ parentGroupName: group.groupName, groupName: row.groupName }),
              },
              {
                key: 'move-to',
                label: 'Move to',
                onClick: () =>
                  group && setMoveTarget({ parentGroupName: group.groupName, groupName: row.groupName }),
              },
              {
                key: 'delete',
                label: 'Delete',
                isDanger: true,
                onClick: () =>
                  group && setDeleteTarget({ parentGroupName: group.groupName, groupName: row.groupName }),
              },
            ]}
          />
        ),
      },
    ],
    [group],
  );

  const handleSubgroupCreated = () => {
    setCreateSubgroupOpen(false);
    queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'subgroups'] });
  };

  const handleRoleAssigned = () => {
    setAssignRoleTarget(null);
    if (group) {
      queryClient.invalidateQueries({ queryKey: ['groups', 'by-name', group.groupName] });
    }
  };

  const handleGroupRenamed = () => {
    setRenameTarget(null);
    queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'subgroups'] });
  };

  const handleGroupMoved = () => {
    setMoveTarget(null);
    queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'subgroups'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  };

  const handleGroupDeleted = () => {
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'subgroups'] });
  };

  const handleMemberAdded = () => {
    setAddMemberOpen(false);
    if (group) {
      queryClient.invalidateQueries({ queryKey: ['groups', 'by-name', group.groupName] });
    }
  };

  const isLoading = groupsQuery.isLoading || subgroupsQuery.isLoading || groupDetailQuery.isLoading;
  const isError = groupsQuery.isError || subgroupsQuery.isError || groupDetailQuery.isError;

  if (isLoading || isError) {
    return (
      <div className={styles.pageBody}>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={groupsQuery.error ?? subgroupsQuery.error ?? groupDetailQuery.error}
          onRetry={() => { groupsQuery.refetch(); subgroupsQuery.refetch(); groupDetailQuery.refetch(); }}
        />
      </div>
    );
  }

  if (!group) {
    return (
      <div className={styles.pageBody}>
        <AppBreadcrumb items={[{ label: 'Groups', to: '/groups' }, { label: 'Not found' }]} />
        <p className={styles.empty}>Group not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Groups', to: '/groups' }, { label: group.groupName }]} />

      <div className={styles.toolbar}>
        <h1 className={styles.title}>{group.groupName}</h1>
      </div>

      <Tabs
        ariaLabel="Group details"
        tabs={[
          {
            key: 'child-groups',
            title: 'Child groups',
            content: (
              <>
                <div className={styles.tabActionsRow}>
                  <SearchBar
                    value={childGroupSearchInput}
                    onChange={setChildGroupSearchInput}
                    onSubmit={(value) => setChildGroupSearch(value.trim())}
                    placeholder="Search child groups"
                    ariaLabel="Search child groups"
                    className={styles.searchBar}
                  />
                  <Button variant="primary" onClick={() => setCreateSubgroupOpen(true)}>
                    Create child group
                  </Button>
                </div>
                <DataTable
                  ariaLabel="Child groups"
                  columns={childGroupColumns}
                  rows={filteredSubgroups}
                  rowKey={(row) => row.id}
                  isCompact
                  emptyState={(
                    <EmptyState
                      title="No groups in this sub group"
                      body="You haven't created any groups in this sub group."
                      actionLabel="Create group"
                      onAction={() => setCreateSubgroupOpen(true)}
                    />
                  )}
                />
              </>
            ),
          },
          {
            key: 'members',
            title: 'Members',
            content: (
              <>
                <div className={styles.tabActionsRowEnd}>
                  <Button variant="primary" onClick={() => setAddMemberOpen(true)}>
                    Add member
                  </Button>
                </div>
                <DataTable
                  ariaLabel="Members"
                  columns={MEMBER_COLUMNS}
                  rows={members}
                  rowKey={(row) => row.userId}
                  isCompact
                  emptyState={(
                    <EmptyState
                      title="No users found"
                      body="This group doesn't have any members yet."
                      actionLabel="Add member"
                      onAction={() => setAddMemberOpen(true)}
                    />
                  )}
                />
              </>
            ),
          },
          {
            key: 'role-mapping',
            title: 'Role mapping',
            content: (
              <>
                <div className={styles.tabActionsRow}>
                  <SearchBar
                    value={roleSearchInput}
                    onChange={setRoleSearchInput}
                    onSubmit={(value) => setRoleSearch(value.trim())}
                    placeholder="Search roles"
                    ariaLabel="Search roles"
                    className={styles.searchBar}
                  />
                  <Button variant="primary" onClick={() => setAssignRoleTarget({ groupName: group.groupName })}>
                    Assign role
                  </Button>
                </div>
                <DataTable
                  ariaLabel="Role mapping"
                  columns={ROLE_COLUMNS}
                  rows={filteredRoles}
                  rowKey={(row) => row.id}
                  isCompact
                  emptyState={(
                    <EmptyState
                      title="No roles for this group"
                      body="You haven't assigned any roles for this group. Assign a role to get started."
                      actionLabel="Assign role"
                      onAction={() => setAssignRoleTarget({ groupName: group.groupName })}
                    />
                  )}
                />
              </>
            ),
          },
        ]}
      />

      {createSubgroupOpen && (
        <CreateGroupModal
          parentGroupName={group.groupName}
          onClose={() => setCreateSubgroupOpen(false)}
          onCreated={handleSubgroupCreated}
        />
      )}

      {addMemberOpen && (
        <AddMemberModal
          groupName={group.groupName}
          onClose={() => setAddMemberOpen(false)}
          onAdded={handleMemberAdded}
        />
      )}

      {assignRoleTarget && (
        <AssignRoleModal
          target={assignRoleTarget}
          onClose={() => setAssignRoleTarget(null)}
          onAssigned={handleRoleAssigned}
        />
      )}

      {renameTarget && (
        <RenameGroupModal
          parentGroupName={renameTarget.parentGroupName}
          groupName={renameTarget.groupName}
          onClose={() => setRenameTarget(null)}
          onRenamed={handleGroupRenamed}
        />
      )}

      {moveTarget && (
        <MoveGroupModal
          parentGroupName={moveTarget.parentGroupName}
          groupName={moveTarget.groupName}
          onClose={() => setMoveTarget(null)}
          onMoved={handleGroupMoved}
        />
      )}

      {deleteTarget && (
        <DeleteGroupModal
          parentGroupName={deleteTarget.parentGroupName}
          groupName={deleteTarget.groupName}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleGroupDeleted}
        />
      )}
    </div>
  );
}

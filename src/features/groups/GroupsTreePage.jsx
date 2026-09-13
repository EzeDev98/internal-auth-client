import { useMemo, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { TreeView } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Button from '../../shared/components/Button';
import QueryState from '../../shared/components/QueryState';
import ActionsMenu from '../../shared/components/ActionsMenu';
import CreateGroupModal from './CreateGroupModal';
import AssignRoleModal from './AssignRoleModal';
import { listGroups, listSubgroups } from './api';
import styles from './GroupsTreePage.module.css';

// Step 9A - tree view backed by Step 2D's GET /groups (top-level groups)
// and GET /groups/{id}/subgroups (one level down). listSubgroups is a
// per-group endpoint, not bulk, so every top-level group gets its own
// subgroups query via useQueries - fired as soon as the top-level list
// resolves, rather than gated behind TreeView's onExpand, since this is a
// flat two-level hierarchy (group -> subgroups, no deeper nesting per
// GroupQueryServiceImpl) and the top-level group count is
// admin-console-sized, not something that needs lazy paging. Each branch
// renders its own loading/error/empty state independently as its query
// settles, rather than blocking the whole tree on the slowest subgroup
// fetch.
//
// Step 9B - each node now carries an ActionsMenu (Step 4E's pattern) via
// TreeView's own per-item `action` slot: top-level groups get "Add
// subgroup" and "Assign role"; subgroups get "Assign role" only. The
// top-level "Create group" button lives in the page toolbar, same
// placement as RolesListPage's "Create role".
//
// Step 12B - only the top-level groups query goes through QueryState;
// each branch's own subgroup query still renders its loading/error/empty
// state independently inside treeData below (see the Step 9A note above),
// since those are per-node tree labels, not a page-level state this
// shared component is meant to gate.
export default function GroupsTreePage() {
  const queryClient = useQueryClient();
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: listGroups });
  const topLevelGroups = groupsQuery.data ?? [];

  const [createGroupTarget, setCreateGroupTarget] = useState(null); // null | { parentGroupName?: string }
  const [assignRoleTarget, setAssignRoleTarget] = useState(null); // null | { groupName } | { parentGroupName, subGroupName }

  const subgroupQueries = useQueries({
    queries: topLevelGroups.map((group) => ({
      queryKey: ['groups', group.id, 'subgroups'],
      queryFn: () => listSubgroups(group.id),
      enabled: groupsQuery.isSuccess,
    })),
  });

  const treeData = useMemo(
    () =>
      topLevelGroups.map((group, index) => {
        const subResult = subgroupQueries[index];
        const groupNodeId = `group-${group.id}`;

        let children;
        if (!subResult || subResult.isLoading) {
          children = [{ id: `${groupNodeId}-loading`, name: 'Loading...', isDisabled: true }];
        } else if (subResult.isError) {
          children = [
            { id: `${groupNodeId}-error`, name: subResult.error?.message ?? 'Failed to load subgroups', isDisabled: true },
          ];
        } else {
          const subgroups = subResult.data ?? [];
          children =
            subgroups.length === 0
              ? [{ id: `${groupNodeId}-empty`, name: 'No subgroups', isDisabled: true }]
              : subgroups.map((sub) => ({
                  id: `subgroup-${sub.id}`,
                  name: sub.groupName,
                  action: (
                    <ActionsMenu
                      ariaLabel={`Actions for ${sub.groupName}`}
                      items={[
                        {
                          key: 'assign-role',
                          label: 'Assign role',
                          onClick: () =>
                            setAssignRoleTarget({ parentGroupName: group.groupName, subGroupName: sub.groupName }),
                        },
                      ]}
                    />
                  ),
                }));
        }

        return {
          id: groupNodeId,
          name: group.groupName,
          children,
          action: (
            <ActionsMenu
              ariaLabel={`Actions for ${group.groupName}`}
              items={[
                {
                  key: 'add-subgroup',
                  label: 'Add subgroup',
                  onClick: () => setCreateGroupTarget({ parentGroupName: group.groupName }),
                },
                {
                  key: 'assign-role',
                  label: 'Assign role',
                  onClick: () => setAssignRoleTarget({ groupName: group.groupName }),
                },
              ]}
            />
          ),
        };
      }),
    [topLevelGroups, subgroupQueries],
  );

  const handleGroupCreated = () => {
    const createdSubgroupOf = createGroupTarget?.parentGroupName;
    setCreateGroupTarget(null);
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    if (createdSubgroupOf) {
      const parent = topLevelGroups.find((g) => g.groupName === createdSubgroupOf);
      if (parent) {
        queryClient.invalidateQueries({ queryKey: ['groups', parent.id, 'subgroups'] });
      }
    }
  };

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Groups' }]} />

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Groups</h1>
        <Button variant="primary" onClick={() => setCreateGroupTarget({})}>
          Create group
        </Button>
      </div>

      <QueryState
        isLoading={groupsQuery.isLoading}
        isError={groupsQuery.isError}
        error={groupsQuery.error}
        onRetry={groupsQuery.refetch}
      >
        {topLevelGroups.length === 0 ? (
          <p className={styles.empty}>No groups found.</p>
        ) : (
          <TreeView aria-label="Permission groups" data={treeData} hasGuides />
        )}
      </QueryState>

      {createGroupTarget && (
        <CreateGroupModal
          parentGroupName={createGroupTarget.parentGroupName}
          onClose={() => setCreateGroupTarget(null)}
          onCreated={handleGroupCreated}
        />
      )}

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

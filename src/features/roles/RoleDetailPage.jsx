import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Tabs from '../../shared/components/Tabs';
import Badge from '../../shared/components/Badge';
import QueryState from '../../shared/components/QueryState';
import { getRole } from './api';
import styles from './RoleDetailPage.module.css';

// Step 8C - detail tabs, backed by Step 2C's GET /roles/{id}. Unlike
// UserDetailPage, RoleDetailResponse returns permissions/permissionGroups/
// usersInRole all in one payload (RoleQueryServiceImpl builds all three at
// once), so there's a single query here rather than one per tab.
function DetailsTab({ role }) {
  return (
    <dl className={styles.readonlyGrid}>
      <dt>Role name</dt>
      <dd>{role.roleName}</dd>
      <dt>Description</dt>
      <dd>{role.description || '—'}</dd>
      <dt>Scope</dt>
      <dd>
        <Badge>{role.clientApplicationId == null ? 'Global' : `Client #${role.clientApplicationId}`}</Badge>
      </dd>
      <dt>Created</dt>
      <dd>{role.createdAt ? new Date(role.createdAt).toLocaleString() : '—'}</dd>
    </dl>
  );
}

// permissionGroups is List<String> (pre-formatted labels, see
// RoleQueryServiceImpl#toGroupLabel) - not the same as permissions
// (fine-grained actions, currently always empty per RolePermissionSummary's
// own Javadoc). Both render here since the plan's "Permissions" tab covers
// both concepts for a role's detail view.
function PermissionsTab({ role }) {
  const permissions = role.permissions ?? [];
  const permissionGroups = role.permissionGroups ?? [];

  return (
    <>
      <h2 className={styles.subheading}>Permissions</h2>
      {permissions.length === 0 ? (
        <p>No fine-grained permissions assigned.</p>
      ) : (
        <ul className={styles.plainList}>
          {permissions.map((permission) => (
            <li key={permission.id}>
              <strong>{permission.permissionName}</strong>
              {permission.description && <span className={styles.listDescription}> — {permission.description}</span>}
            </li>
          ))}
        </ul>
      )}

      <h2 className={styles.subheading}>Permission groups</h2>
      {permissionGroups.length === 0 ? (
        <p>Not assigned to any permission group.</p>
      ) : (
        <ul className={styles.plainList}>
          {permissionGroups.map((group) => (
            <li key={group}>{group}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function UsersInRoleTab({ users }) {
  if (users.length === 0) return <p>No users directly assigned this role.</p>;

  return (
    <ul className={styles.plainList}>
      {users.map((user) => (
        <li key={user.id}>{user.username}</li>
      ))}
    </ul>
  );
}

export default function RoleDetailPage() {
  const { id } = useParams();

  const {
    data: role, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['roles', id],
    queryFn: () => getRole(id),
  });

  if (isLoading || isError) {
    return (
      <div className={styles.pageBody}>
        <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Roles', to: '/roles' }, { label: role.roleName }]} />
      <h1 className={styles.title}>{role.roleName}</h1>

      <Tabs
        ariaLabel="Role details"
        tabs={[
          { key: 'details', title: 'Details', content: <DetailsTab role={role} /> },
          { key: 'permissions', title: 'Permissions', content: <PermissionsTab role={role} /> },
          {
            key: 'users-in-role',
            title: 'Users in role',
            content: <UsersInRoleTab users={role.usersInRole ?? []} />,
          },
        ]}
      />
    </div>
  );
}

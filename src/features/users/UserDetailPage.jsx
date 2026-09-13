import { useParams, useSearchParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Alert } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Tabs from '../../shared/components/Tabs';
import Badge from '../../shared/components/Badge';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import { getUser, getUserRoles, getUserPermissionGroups, getUserSessions } from './api';
import styles from './UserDetailPage.module.css';

// Step 7B - detail tabs, backed by Steps 2A/2E's GET /users/{username},
// GET /users/{username}/roles, GET /users/{username}/permission-groups,
// and GET /admin/sessions (all already existed on the server despite the
// plan marking them "Needed"). The plan's separate "Permissions" tab is
// folded into "Permission Groups" here - RolePermissionSummary's own
// Javadoc documents fine-grained permissions as always an empty list for
// every role today, so a tab dedicated to them would only ever render
// empty.
function OverviewTab({ user }) {
  return (
    <dl className={styles.readonlyGrid}>
      <dt>Username</dt>
      <dd>{user.username}</dd>
      <dt>Email</dt>
      <dd>{user.email ?? '—'} {user.emailVerified && <Badge>Verified</Badge>}</dd>
      <dt>Phone</dt>
      <dd>{user.phoneNumber ?? '—'} {user.phoneVerified && <Badge>Verified</Badge>}</dd>
      <dt>Enabled</dt>
      <dd>{user.enabled ? 'Yes' : 'No'}</dd>
      <dt>MFA enabled</dt>
      <dd>{user.mfaEnabled ? 'Yes' : 'No'}</dd>
      <dt>Created</dt>
      <dd>{user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</dd>
    </dl>
  );
}

function RolesTab({ username }) {
  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, 'roles'],
    queryFn: () => getUserRoles(username),
  });

  const roles = data ?? [];

  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      {roles.length === 0 ? (
        <p>No roles assigned.</p>
      ) : (
        <ul className={styles.plainList}>
          {roles.map((role) => (
            <li key={role.roleId}>
              <strong>{role.roleName}</strong>
              {role.description && <span className={styles.listDescription}> — {role.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}

function PermissionGroupsTab({ username }) {
  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, 'permission-groups'],
    queryFn: () => getUserPermissionGroups(username),
  });

  const groups = data ?? [];

  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      {groups.length === 0 ? (
        <p>No permission groups assigned.</p>
      ) : (
        <ul className={styles.plainList}>
          {groups.map((group) => (
            <li key={group.groupId}>
              <strong>{group.groupName}</strong>
              {group.description && <span className={styles.listDescription}> — {group.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}

const SESSION_COLUMNS = [
  { key: 'ipAddress', label: 'IP address', render: (row) => row.ipAddress ?? '—' },
  { key: 'device', label: 'Device', render: (row) => row.device ?? '—' },
  { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
  {
    key: 'createdAt',
    label: 'Started',
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'),
  },
  {
    key: 'endedAt',
    label: 'Ended',
    render: (row) => (row.endedAt ? new Date(row.endedAt).toLocaleString() : '—'),
  },
];

function SessionsTab({ username, clientId }) {
  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, 'sessions', clientId],
    queryFn: () => getUserSessions(username, clientId),
  });

  const rows = data?.content ?? [];

  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      <DataTable
        ariaLabel="Sessions"
        columns={SESSION_COLUMNS}
        rows={rows}
        rowKey={(row) => row.id}
        emptyStateMessage="No sessions found."
      />
    </QueryState>
  );
}

export default function UserDetailPage() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  const {
    data: user, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, clientId],
    queryFn: () => getUser(username, clientId),
    enabled: Boolean(clientId),
  });

  if (!clientId) {
    return (
      <div className={styles.pageBody}>
        <AppBreadcrumb items={[{ label: 'Users', to: '/users' }, { label: username }]} />
        <Alert
          variant="danger"
          title="Missing clientId"
        >
          This link is missing the client it belongs to, so the user can't be looked up. Go back to{' '}
          <Link to="/users">Users</Link> and open this user from the list.
        </Alert>
      </div>
    );
  }

  if (isLoading || isError) {
    return (
      <div className={styles.pageBody}>
        <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Users', to: '/users' }, { label: user.username }]} />
      <h1 className={styles.title}>{user.username}</h1>

      <Tabs
        ariaLabel="User details"
        tabs={[
          { key: 'overview', title: 'Overview', content: <OverviewTab user={user} /> },
          { key: 'roles', title: 'Roles', content: <RolesTab username={username} /> },
          {
            key: 'permission-groups',
            title: 'Permission Groups',
            content: <PermissionGroupsTab username={username} />,
          },
          {
            key: 'sessions',
            title: 'Sessions',
            content: <SessionsTab username={username} clientId={clientId} />,
          },
        ]}
      />
    </div>
  );
}

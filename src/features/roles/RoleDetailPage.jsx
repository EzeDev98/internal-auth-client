// Role detail screen with its permissions and users.
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Form, FormGroup, TextInput, TextArea } from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Tabs from '../../shared/components/Tabs';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import { getRole } from './api';
import styles from './RoleDetailPage.module.css';

const USERS_IN_ROLE_COLUMNS = [
  { key: 'username', label: 'Username', render: (user) => user.username },
  { key: 'email', label: 'Email', render: (user) => user.email || '—' },
];

function DetailsTab({ role }) {
  return (
    <Form className={styles.formBody} isHorizontal>
      <FormGroup label="Role name" fieldId="roleName">
        <TextInput id="roleName" value={role.roleName} readOnlyVariant="default" />
      </FormGroup>

      <FormGroup label="Description" fieldId="description">
        <TextArea id="description" value={role.description || ''} readOnlyVariant="default" />
      </FormGroup>

      <FormGroup label="Scope" fieldId="scope">
        <TextInput
          id="scope"
          value={role.clientApplicationId == null ? 'Global' : `Client #${role.clientApplicationId}`}
          readOnlyVariant="default"
        />
      </FormGroup>

      <FormGroup label="Created" fieldId="createdAt">
        <TextInput
          id="createdAt"
          value={role.createdAt ? new Date(role.createdAt).toLocaleString() : '—'}
          readOnlyVariant="default"
        />
      </FormGroup>
    </Form>
  );
}

function UsersInRoleTab({ users }) {
  return (
    <DataTable
      ariaLabel="Users in role"
      columns={USERS_IN_ROLE_COLUMNS}
      rows={users}
      rowKey={(user) => user.id}
      isCompact
      emptyStateMessage="No users directly assigned this role."
    />
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

  return (
    <div className={styles.pageBody}>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {role && (
          <>
            <AppBreadcrumb items={[{ label: 'Roles', to: '/roles' }, { label: role.roleName }]} />
            <h1 className={styles.title}>{role.roleName}</h1>

            <Tabs
              ariaLabel="Role details"
              tabs={[
                { key: 'details', title: 'Details', content: <DetailsTab role={role} /> },
                {
                  key: 'users-in-role',
                  title: 'Users in role',
                  content: <UsersInRoleTab users={role.usersInRole ?? []} />,
                },
              ]}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}

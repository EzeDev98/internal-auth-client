// User detail screen with details, credentials, roles and groups.
import {
  useState, useEffect, useMemo, useRef,
} from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert, Form, FormGroup, ActionGroup, Switch, TextInput,
} from '@patternfly/react-core';
import AppBreadcrumb from '../../shared/components/Breadcrumb';
import Tabs from '../../shared/components/Tabs';
import DataTable from '../../shared/components/DataTable';
import QueryState from '../../shared/components/QueryState';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import PasswordInput from '../../shared/components/PasswordInput';
import SearchBar from '../../shared/components/SearchBar';
import ActionsMenu from '../../shared/components/ActionsMenu';
import EmptyState from '../../shared/components/EmptyState';
import AssignRoleModal from './AssignRoleModal';
import JoinGroupModal from './JoinGroupModal';
import {
  getUser, getUserRoles, getUserPermissionGroups, getUserCredential, resetUserPassword, getUserSessions,
  updateUser, unassignRole, assignRoleToUser,
} from './api';
import { listRoles } from '../roles/api';
import { listGroups, addGroupMember, removeGroupMember } from '../groups/api';
import { revokeSession } from '../sessions/api';
import { resetUserPasswordSchema } from './resetUserPasswordSchema';
import { updateUserSchema } from './updateUserSchema';
import { useToast } from '../../shared/lib/useToast';
import styles from './UserDetailPage.module.css';

function ConfirmActionModal({
  title, body, confirmLabel, isLoading, error, onConfirm, onClose, variant = 'danger',
}) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      footer={(
        <>
          <Button variant={variant} isLoading={isLoading} onClick={onConfirm}>{confirmLabel}</Button>
          <Button variant="link" onClick={onClose}>Cancel</Button>
        </>
      )}
    >
      {error && <Alert variant="danger" title={error} />}
      <p>{body}</p>
    </Modal>
  );
}

function toFormValues(user) {
  return {
    enabled: user.enabled,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}

function OverviewTab({ user, username, clientId }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);
  const [saved, setSaved] = useState(false);

  const {
    handleSubmit, control, reset, formState: { isSubmitting },
  } = useForm({ resolver: zodResolver(updateUserSchema) });

  const resetToUser = (current) => {
    if (!current) return;
    reset(toFormValues(current));
    setServerError(null);
    setSaved(false);
  };

  const [syncedUser, setSyncedUser] = useState(null);
  if (user && user !== syncedUser) {
    setSyncedUser(user);
    setServerError(null);
    setSaved(false);
  }

  useEffect(() => {
    if (user) reset(toFormValues(user));
  }, [user, reset]);

  const onSubmit = async (values) => {
    setServerError(null);
    setSaved(false);
    try {
      const updated = await updateUser(username, clientId, values);
      queryClient.setQueryData(['users', username, clientId], updated);
      setSaved(true);
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className={styles.overviewForm} isHorizontal>
      {serverError && <Alert variant="danger" isInline title={serverError} className={styles.serverError} />}
      {saved && <Alert variant="success" isInline title="User updated" className={styles.serverError} />}

      <FormGroup label="ID" fieldId="id">
        <TextInput id="id" value={String(user.id)} readOnlyVariant="default" />
      </FormGroup>

      <FormGroup label="Client application" fieldId="clientId">
        <TextInput id="clientId" value={clientId ?? '—'} readOnlyVariant="default" />
      </FormGroup>

      <FormGroup label="Created at" fieldId="createdAt">
        <TextInput
          id="createdAt"
          value={user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
          readOnlyVariant="default"
        />
      </FormGroup>

      <FormGroup label="Username" fieldId="username">
        <TextInput id="username" value={user.username} readOnlyVariant="default" />
      </FormGroup>

      <FormGroup label="Email" fieldId="email">
        <TextInput id="email" value={user.email ?? '—'} readOnlyVariant="default" />
      </FormGroup>

      <FormGroup label="Email verified" fieldId="emailVerified">
        <Controller
          name="emailVerified"
          control={control}
          render={({ field }) => (
            <Switch
              id="emailVerified"
              isChecked={field.value ?? false}
              onChange={(_event, checked) => field.onChange(checked)}
              label="Yes"
              labelOff="No"
              isDisabled={!user.email}
            />
          )}
        />
      </FormGroup>

      <FormGroup label="Phone" fieldId="phoneNumber">
        <TextInput id="phoneNumber" value={user.phoneNumber ?? '—'} readOnlyVariant="default" />
      </FormGroup>

      <FormGroup label="Phone verified" fieldId="phoneVerified">
        <Controller
          name="phoneVerified"
          control={control}
          render={({ field }) => (
            <Switch
              id="phoneVerified"
              isChecked={field.value ?? false}
              onChange={(_event, checked) => field.onChange(checked)}
              label="Yes"
              labelOff="No"
              isDisabled={!user.phoneNumber}
            />
          )}
        />
      </FormGroup>

      <FormGroup label="Enabled" fieldId="enabled">
        <Controller
          name="enabled"
          control={control}
          render={({ field }) => (
            <Switch
              id="enabled"
              isChecked={field.value ?? false}
              onChange={(_event, checked) => field.onChange(checked)}
              label="Yes"
              labelOff="No"
            />
          )}
        />
      </FormGroup>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>Save</Button>
        <Button type="button" variant="link" onClick={() => resetToUser(user)}>Revert</Button>
      </div>
    </Form>
  );
}

const ROLE_COLUMNS_BASE = [
  {
    key: 'roleName', label: 'Name', width: 35, modifier: 'nowrap', render: (row) => row.roleName,
  },
  { key: 'description', label: 'Description', modifier: 'truncate', render: (row) => row.description || '—' },
];

function RolesTab({ username }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchInput, setSearchInputRaw] = useState('');
  const [dropdownClosed, setDropdownClosed] = useState(false);
  const searchWrapperRef = useRef(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState(null);
  const [unassignError, setUnassignError] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [quickAssignTarget, setQuickAssignTarget] = useState(null);
  const [quickAssignError, setQuickAssignError] = useState(null);
  const [isQuickAssigning, setIsQuickAssigning] = useState(false);

  const setSearchInput = (value) => {
    setSearchInputRaw(value);
    setDropdownClosed(false);
  };

  const trimmedSearch = searchInput.trim();
  const isSearching = Boolean(trimmedSearch);
  const showDropdown = isSearching && !dropdownClosed;

  useEffect(() => {
    if (!showDropdown) return undefined;
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setDropdownClosed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const {
    data, isLoading: assignedLoading, isError: assignedIsError, error: assignedError, refetch: assignedRefetch,
  } = useQuery({
    queryKey: ['users', username, 'roles'],
    queryFn: () => getUserRoles(username),
  });

  const roles = useMemo(() => data ?? [], [data]);
  const assignedRoleNames = useMemo(() => new Set(roles.map((role) => role.roleName)), [roles]);

  const {
    data: catalog, isLoading: catalogLoading, isError: catalogIsError,
  } = useQuery({
    queryKey: ['roles', 'catalog'],
    queryFn: listRoles,
    enabled: isSearching,
  });

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const needle = trimmedSearch.toLowerCase();
    return (catalog ?? []).filter((role) => role.roleName?.toLowerCase().includes(needle));
  }, [catalog, isSearching, trimmedSearch]);

  const handleAssigned = (roleName) => {
    setIsAssignOpen(false);
    toast.success(roleName ? `Role "${roleName}" assigned to ${username}.` : 'Role assigned successfully.');
    queryClient.invalidateQueries({ queryKey: ['users', username, 'roles'] });
  };

  const closeUnassign = () => {
    if (isUnassigning) return;
    setUnassignTarget(null);
    setUnassignError(null);
  };

  const handleUnassign = async () => {
    setUnassignError(null);
    setIsUnassigning(true);
    try {
      await unassignRole(username, unassignTarget);
      setUnassignTarget(null);
      queryClient.invalidateQueries({ queryKey: ['users', username, 'roles'] });
    } catch (err) {
      setUnassignError(err.message);
    } finally {
      setIsUnassigning(false);
    }
  };

  const closeQuickAssign = () => {
    if (isQuickAssigning) return;
    setQuickAssignTarget(null);
    setQuickAssignError(null);
  };

  const handleQuickAssign = async () => {
    setQuickAssignError(null);
    setIsQuickAssigning(true);
    try {
      await assignRoleToUser(username, { roleName: quickAssignTarget });
      toast.success(`Role "${quickAssignTarget}" assigned to ${username}.`);
      setQuickAssignTarget(null);
      setSearchInputRaw('');
      queryClient.invalidateQueries({ queryKey: ['users', username, 'roles'] });
    } catch (err) {
      setQuickAssignError(err.message);
    } finally {
      setIsQuickAssigning(false);
    }
  };

  const assignedColumns = [
    ...ROLE_COLUMNS_BASE,
    {
      key: 'actions',
      label: '',
      isAction: true,
      render: (row) => (
        <ActionsMenu
          ariaLabel={`Actions for ${row.roleName}`}
          items={[
            { key: 'unassign', label: 'Unassign', isDanger: true, onClick: () => setUnassignTarget(row.roleName) },
          ]}
        />
      ),
    },
  ];

  return (
    <QueryState
      isLoading={assignedLoading}
      isError={assignedIsError}
      error={assignedError}
      onRetry={assignedRefetch}
    >
      <div className={styles.tabActionsRow}>
        <div className={styles.searchWrapper} ref={searchWrapperRef}>
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={(value) => setSearchInput(value.trim())}
            placeholder="Search all roles to assign"
            ariaLabel="Search roles"
          />
          {showDropdown && (
            <div className={styles.roleDropdown}>
              {catalogLoading && <div className={styles.roleDropdownMessage}>Loading roles…</div>}
              {catalogIsError && <div className={styles.roleDropdownMessage}>Couldn&apos;t load roles.</div>}
              {!catalogLoading && !catalogIsError && searchResults.length === 0 && (
                <div className={styles.roleDropdownMessage}>No roles found matching your search.</div>
              )}
              {!catalogLoading && !catalogIsError && searchResults.map((role) => {
                const isAssigned = assignedRoleNames.has(role.roleName);
                return (
                  <button
                    key={role.id}
                    type="button"
                    className={styles.roleDropdownItemButton}
                    disabled={isAssigned}
                    onClick={() => {
                      setQuickAssignTarget(role.roleName);
                      setDropdownClosed(true);
                    }}
                  >
                    <span className={styles.roleDropdownText}>
                      <span className={styles.roleDropdownName}>{role.roleName}</span>
                      {role.description && (
                        <span className={styles.roleDropdownDescription}>{role.description}</span>
                      )}
                    </span>
                    {isAssigned && <span className={styles.roleDropdownAssigned}>Assigned</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <Button variant="primary" onClick={() => setIsAssignOpen(true)}>Assign role</Button>
      </div>

      <DataTable
        ariaLabel="Role mapping"
        columns={assignedColumns}
        rows={roles}
        rowKey={(row) => row.roleId}
        isCompact
        simple
        emptyState={(
          <EmptyState
            title="No roles assigned"
            body="This user doesn't have any roles yet. Assign a role to get started."
            actionLabel="Assign role"
            onAction={() => setIsAssignOpen(true)}
          />
        )}
      />

      {isAssignOpen && (
        <AssignRoleModal username={username} onClose={() => setIsAssignOpen(false)} onAssigned={handleAssigned} />
      )}

      {unassignTarget && (
        <ConfirmActionModal
          title={`Unassign ${unassignTarget}?`}
          body={`This removes the "${unassignTarget}" role from ${username}.`}
          confirmLabel="Unassign"
          isLoading={isUnassigning}
          error={unassignError}
          onConfirm={handleUnassign}
          onClose={closeUnassign}
        />
      )}

      {quickAssignTarget && (
        <ConfirmActionModal
          title={`Assign "${quickAssignTarget}" to ${username}?`}
          body={`This gives ${username} the "${quickAssignTarget}" role.`}
          confirmLabel="Assign"
          variant="primary"
          isLoading={isQuickAssigning}
          error={quickAssignError}
          onConfirm={handleQuickAssign}
          onClose={closeQuickAssign}
        />
      )}
    </QueryState>
  );
}

function CredentialsTab({ username, clientId }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const {
    data: credential, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, 'credentials', clientId],
    queryFn: () => getUserCredential(username, clientId),
  });

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetError, setResetError] = useState(null);
  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetUserPasswordSchema) });

  const openReset = () => {
    reset({ newPassword: '', confirmPassword: '' });
    setResetError(null);
    setIsResetOpen(true);
  };

  const closeReset = () => {
    if (isSubmitting) return;
    setIsResetOpen(false);
  };

  const onSubmit = async (values) => {
    setResetError(null);
    try {
      await resetUserPassword(username, clientId, values);
      setIsResetOpen(false);
      toast.success('Password reset successfully.');
      queryClient.invalidateQueries({ queryKey: ['users', username, 'credentials'] });
    } catch (err) {
      setResetError(err.message);
    }
  };

  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      {credential && (
        <table className={styles.credentialTable}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Created at</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{credential.type === 'password' ? 'Password' : credential.type}</td>
              <td className={styles.credentialCreatedAt}>
                {credential.createdAt ? (
                  <>
                    <span className={styles.credentialCreatedAtFull}>
                      {new Date(credential.createdAt).toLocaleString()}
                    </span>
                    <span className={styles.credentialCreatedAtShort}>
                      {new Date(credential.createdAt).toLocaleDateString()}
                    </span>
                  </>
                ) : '—'}
              </td>
              <td className={styles.credentialActions}>
                <Button variant="secondary" onClick={openReset}>Reset password</Button>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <Modal isOpen={isResetOpen} onClose={closeReset} title="Reset password">
        {resetError && <Alert variant="danger" title={resetError} />}
        <p className={styles.resetIntro}>
          This sets a new password directly for
          {' '}
          <strong>{username}</strong>
          {' '}
          and ends their active session - they&apos;ll need to sign in again with the new password.
        </p>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup label="New password" isRequired fieldId="newPassword">
            <PasswordInput
              id="newPassword"
              {...register('newPassword')}
              validated={errors.newPassword ? 'error' : 'default'}
            />
            {errors.newPassword && <div className={styles.fieldError}>{errors.newPassword.message}</div>}
          </FormGroup>

          <FormGroup label="Confirm new password" isRequired fieldId="confirmPassword">
            <PasswordInput
              id="confirmPassword"
              {...register('confirmPassword')}
              validated={errors.confirmPassword ? 'error' : 'default'}
            />
            {errors.confirmPassword && <div className={styles.fieldError}>{errors.confirmPassword.message}</div>}
          </FormGroup>

          <ActionGroup className={styles.resetActions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Reset password</Button>
            <Button variant="link" onClick={closeReset} isDisabled={isSubmitting}>Cancel</Button>
          </ActionGroup>
        </Form>
      </Modal>
    </QueryState>
  );
}

const GROUP_COLUMNS_BASE = [
  {
    key: 'groupName', label: 'Name', width: 35, modifier: 'nowrap', render: (row) => row.groupName,
  },
  { key: 'description', label: 'Description', modifier: 'truncate', render: (row) => row.description || '—' },
];

function PermissionGroupsTab({ username }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchInput, setSearchInputRaw] = useState('');
  const [dropdownClosed, setDropdownClosed] = useState(false);
  const searchWrapperRef = useRef(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [leaveError, setLeaveError] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [quickJoinTarget, setQuickJoinTarget] = useState(null);
  const [quickJoinError, setQuickJoinError] = useState(null);
  const [isQuickJoining, setIsQuickJoining] = useState(false);

  const setSearchInput = (value) => {
    setSearchInputRaw(value);
    setDropdownClosed(false);
  };

  const trimmedSearch = searchInput.trim();
  const isSearching = Boolean(trimmedSearch);
  const showDropdown = isSearching && !dropdownClosed;

  useEffect(() => {
    if (!showDropdown) return undefined;
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setDropdownClosed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, 'permission-groups'],
    queryFn: () => getUserPermissionGroups(username),
  });

  const groups = useMemo(() => data ?? [], [data]);
  const joinedGroupNames = useMemo(() => new Set(groups.map((group) => group.groupName)), [groups]);

  const {
    data: catalog, isLoading: catalogLoading, isError: catalogIsError,
  } = useQuery({
    queryKey: ['groups', 'catalog'],
    queryFn: listGroups,
    enabled: isSearching,
  });

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const needle = trimmedSearch.toLowerCase();
    return (catalog ?? []).filter((group) => group.groupName?.toLowerCase().includes(needle));
  }, [catalog, isSearching, trimmedSearch]);

  const handleJoined = (groupName) => {
    setIsJoinOpen(false);
    toast.success(groupName ? `Added ${username} to "${groupName}".` : 'Added to permission group successfully.');
    queryClient.invalidateQueries({ queryKey: ['users', username, 'permission-groups'] });
  };

  const closeLeave = () => {
    if (isLeaving) return;
    setLeaveTarget(null);
    setLeaveError(null);
  };

  const handleLeave = async () => {
    setLeaveError(null);
    setIsLeaving(true);
    try {
      await removeGroupMember(leaveTarget, username);
      setLeaveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['users', username, 'permission-groups'] });
    } catch (err) {
      setLeaveError(err.message);
    } finally {
      setIsLeaving(false);
    }
  };

  const closeQuickJoin = () => {
    if (isQuickJoining) return;
    setQuickJoinTarget(null);
    setQuickJoinError(null);
  };

  const handleQuickJoin = async () => {
    setQuickJoinError(null);
    setIsQuickJoining(true);
    try {
      await addGroupMember(quickJoinTarget, { username });
      toast.success(`Added ${username} to "${quickJoinTarget}".`);
      setQuickJoinTarget(null);
      setSearchInputRaw('');
      queryClient.invalidateQueries({ queryKey: ['users', username, 'permission-groups'] });
    } catch (err) {
      setQuickJoinError(err.message);
    } finally {
      setIsQuickJoining(false);
    }
  };

  const columns = [
    ...GROUP_COLUMNS_BASE,
    {
      key: 'actions',
      label: '',
      isAction: true,
      render: (row) => (
        <ActionsMenu
          ariaLabel={`Actions for ${row.groupName}`}
          items={[
            { key: 'leave', label: 'Leave', isDanger: true, onClick: () => setLeaveTarget(row.groupName) },
          ]}
        />
      ),
    },
  ];

  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      <div className={styles.tabActionsRow}>
        <div className={styles.searchWrapper} ref={searchWrapperRef}>
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={(value) => setSearchInput(value.trim())}
            placeholder="Search all groups to join"
            ariaLabel="Search permission groups"
          />
          {showDropdown && (
            <div className={styles.roleDropdown}>
              {catalogLoading && <div className={styles.roleDropdownMessage}>Loading groups…</div>}
              {catalogIsError && <div className={styles.roleDropdownMessage}>Couldn&apos;t load groups.</div>}
              {!catalogLoading && !catalogIsError && searchResults.length === 0 && (
                <div className={styles.roleDropdownMessage}>No groups found matching your search.</div>
              )}
              {!catalogLoading && !catalogIsError && searchResults.map((group) => {
                const isJoined = joinedGroupNames.has(group.groupName);
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={styles.roleDropdownItemButton}
                    disabled={isJoined}
                    onClick={() => {
                      setQuickJoinTarget(group.groupName);
                      setDropdownClosed(true);
                    }}
                  >
                    <span className={styles.roleDropdownText}>
                      <span className={styles.roleDropdownName}>{group.groupName}</span>
                      {group.description && (
                        <span className={styles.roleDropdownDescription}>{group.description}</span>
                      )}
                    </span>
                    {isJoined && <span className={styles.roleDropdownAssigned}>Joined</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <Button variant="primary" onClick={() => setIsJoinOpen(true)}>Join Group</Button>
      </div>

      <DataTable
        ariaLabel="Permission groups"
        columns={columns}
        rows={groups}
        rowKey={(row) => row.groupId}
        isCompact
        simple
        emptyState={(
          <EmptyState
            title="No permission groups"
            body="This user isn't a member of any permission groups yet. Join a group to get started."
            actionLabel="Join Group"
            onAction={() => setIsJoinOpen(true)}
          />
        )}
      />

      {isJoinOpen && (
        <JoinGroupModal username={username} onClose={() => setIsJoinOpen(false)} onJoined={handleJoined} />
      )}

      {leaveTarget && (
        <ConfirmActionModal
          title={`Leave ${leaveTarget}?`}
          body={`This removes ${username} from the "${leaveTarget}" permission group.`}
          confirmLabel="Leave"
          isLoading={isLeaving}
          error={leaveError}
          onConfirm={handleLeave}
          onClose={closeLeave}
        />
      )}

      {quickJoinTarget && (
        <ConfirmActionModal
          title={`Add ${username} to "${quickJoinTarget}"?`}
          body={`This adds ${username} to the "${quickJoinTarget}" permission group.`}
          confirmLabel="Add"
          variant="primary"
          isLoading={isQuickJoining}
          error={quickJoinError}
          onConfirm={handleQuickJoin}
          onClose={closeQuickJoin}
        />
      )}
    </QueryState>
  );
}

const SESSION_COLUMNS = [
  { key: 'ipAddress', label: 'IP address', render: (row) => row.ipAddress ?? '—' },
  { key: 'clientId', label: 'Client', render: (row) => row.clientId ?? '—' },
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
  const queryClient = useQueryClient();
  const toast = useToast();
  const [logoutError, setLogoutError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, 'sessions', clientId],
    queryFn: () => getUserSessions(username, clientId),
  });

  const rows = useMemo(() => data?.content ?? [], [data]);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const needle = search.toLowerCase();
    return rows.filter((row) => (
      row.ipAddress?.toLowerCase().includes(needle) || row.clientId?.toLowerCase().includes(needle)
    ));
  }, [rows, search]);

  const handleSearchSubmit = (value) => {
    setSearch(value.trim());
  };

  const handleLogoutAll = async () => {
    setLogoutError(null);
    setIsLoggingOut(true);
    try {
      await revokeSession({ username, clientId });
      toast.success('Logged out all sessions');
      queryClient.invalidateQueries({ queryKey: ['users', username, 'sessions'] });
    } catch (err) {
      setLogoutError(err.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      {logoutError && <Alert variant="danger" isInline title={logoutError} className={styles.sessionsError} />}
      <div className={styles.sessionsToolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
          placeholder="Search by IP address or client"
          ariaLabel="Search sessions"
          className={styles.sessionsSearchBar}
        />
        <Button variant="primary" onClick={handleLogoutAll} isLoading={isLoggingOut} isDisabled={rows.length === 0}>
          Logout all sessions
        </Button>
      </div>
      <DataTable
        ariaLabel="Sessions"
        columns={SESSION_COLUMNS}
        rows={filteredRows}
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
        <AppBreadcrumb items={[{ label: 'Users', to: '/users' }, { label: 'User details' }]} />
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

  return (
    <div className={styles.pageBody}>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {user && (
          <>
            <AppBreadcrumb items={[{ label: 'Users', to: '/users' }, { label: 'User details' }]} />
            <h1 className={styles.title}>{user.username}</h1>

            <Tabs
              ariaLabel="User details"
              tabs={[
                {
                  key: 'overview',
                  title: 'Overview',
                  content: <OverviewTab user={user} username={username} clientId={clientId} />,
                },
                { key: 'roles', title: 'Roles', content: <RolesTab username={username} /> },
                {
                  key: 'credentials',
                  title: 'Credentials',
                  content: <CredentialsTab username={username} clientId={clientId} />,
                },
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
          </>
        )}
      </QueryState>
    </div>
  );
}

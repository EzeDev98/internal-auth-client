import {
  useState, useEffect, useMemo, useRef,
} from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert, AlertActionCloseButton, Form, FormGroup, ActionGroup, Switch, TextInput,
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
import styles from './UserDetailPage.module.css';

// Small reusable danger-confirm modal, shared by the Roles tab's
// "Unassign" action and (Step 5) the Permission Groups tab's "Leave"
// action - same shape as groups/DeleteGroupModal.jsx's own confirm
// pattern (danger-variant confirm button, no other fields), just generic
// enough for both callers instead of two near-identical one-offs.
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

// Step 7B - detail tabs, backed by Steps 2A/2E's GET /users/{username},
// GET /users/{username}/roles, GET /users/{username}/permission-groups,
// and GET /admin/sessions (all already existed on the server despite the
// plan marking them "Needed"). The plan's separate "Permissions" tab is
// folded into "Permission Groups" here - RolePermissionSummary's own
// Javadoc documents fine-grained permissions as always an empty list for
// every role today, so a tab dedicated to them would only ever render
// empty.
// Overview tab, backed by the existing PATCH /users/{username}
// (AdminUserController#updateUser) - enabled/emailVerified/phoneVerified
// are the only editable fields (AdminUpdateUserRequest's own Javadoc);
// username/email/phone/createdAt/mfaEnabled stay read-only. Same
// Save/Revert shape as ClientDetailPage's own Settings tab, reusing its
// useEffect-driven reset-on-refetch pattern rather than a one-off here.
function OverviewTab({ user, username, clientId }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);
  const [saved, setSaved] = useState(false);

  const {
    handleSubmit, control, reset, formState: { isSubmitting },
  } = useForm({ resolver: zodResolver(updateUserSchema) });

  const resetToUser = (current) => {
    if (!current) return;
    reset({
      enabled: current.enabled,
      emailVerified: current.emailVerified,
      phoneVerified: current.phoneVerified,
    });
    setServerError(null);
    setSaved(false);
  };

  useEffect(() => {
    resetToUser(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

      <FormGroup label="Created at" fieldId="createdAt">
        <TextInput
          id="createdAt"
          value={user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
          readOnlyVariant="default"
        />
      </FormGroup>

      {/* Username/email/phone/MFA aren't editable here - only
          enabled/emailVerified/phoneVerified are (updateUserSchema, and
          the docstring above) - so these render readOnlyVariant="default"
          like ID/Created at above, same as ClientDetailPage's own
          non-editable Client ID field, rather than live inputs. */}
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

      <FormGroup label="MFA enabled" fieldId="mfaEnabled">
        <TextInput id="mfaEnabled" value={user.mfaEnabled ? 'Yes' : 'No'} readOnlyVariant="default" />
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
    key: 'roleName', label: 'Name', width: 20, modifier: 'nowrap', render: (row) => row.roleName,
  },
  { key: 'description', label: 'Description', modifier: 'truncate', render: (row) => row.description || '—' },
];

// Roles tab, backed by the existing GET/POST /users/{username}/roles and
// DELETE /users/{username}/roles/{roleName} (PermissionController). Same
// DataTable + tabActionsRow (search + primary action) + ActionsMenu shape
// as GroupDetailPage's own "Role mapping" tab - no "Inherited" column,
// since fetchUserRoles has no concept of an inherited-vs-direct role for
// a user (that's a group-membership idea, not modelled here).
function RolesTab({ username }) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInputRaw] = useState('');
  const [dropdownClosed, setDropdownClosed] = useState(false);
  const searchWrapperRef = useRef(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState(null); // null | roleName
  const [unassignError, setUnassignError] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [quickAssignTarget, setQuickAssignTarget] = useState(null); // null | roleName
  const [quickAssignError, setQuickAssignError] = useState(null);
  const [isQuickAssigning, setIsQuickAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Typing always reopens the dropdown; only a selection or an outside
  // click closes it early, so narrowing/widening the search text doesn't
  // require refocusing anything.
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

  // The success alert fades itself out visually via assignSuccessAlert's
  // CSS animation - this just clears it from the tree afterward so it
  // isn't left invisible-but-present (and so a later assign re-triggers
  // the animation instead of silently no-op'ing on an unchanged node).
  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(null), 1000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const {
    data, isLoading: assignedLoading, isError: assignedIsError, error: assignedError, refetch: assignedRefetch,
  } = useQuery({
    queryKey: ['users', username, 'roles'],
    queryFn: () => getUserRoles(username),
  });

  const roles = data ?? [];
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
    setSuccessMessage(roleName ? `Role "${roleName}" assigned to ${username}.` : 'Role assigned successfully.');
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
      setSuccessMessage(`Role "${quickAssignTarget}" assigned to ${username}.`);
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
      {successMessage && (
        <Alert
          variant="success"
          isInline
          title={successMessage}
          actionClose={<AlertActionCloseButton onClose={() => setSuccessMessage(null)} />}
          className={styles.assignSuccessAlert}
        />
      )}

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

// Step 2H - Credentials tab, backed by GET /users/{username}/credentials
// and the "Reset password" action's POST /users/{username}/credentials/reset
// (both new - see AdminUserController). This app stores one password
// credential per user (see UserCredentialResponse's Javadoc), so unlike
// the Keycloak reference this is always a single row, with no "Show data"
// affordance - the server never returns the hash itself, only metadata.
function CredentialsTab({ username, clientId }) {
  const queryClient = useQueryClient();
  const {
    data: credential, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, 'credentials', clientId],
    queryFn: () => getUserCredential(username, clientId),
  });

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
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
      setResetSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['users', username, 'credentials'] });
    } catch (err) {
      setResetError(err.message);
    }
  };

  // Same shrink-wrap + auto-fade treatment as RolesTab's own
  // assignSuccessAlert - the modal closing on success gave no other
  // indication anything had happened.
  useEffect(() => {
    if (!resetSuccess) return undefined;
    const timer = setTimeout(() => setResetSuccess(false), 1000);
    return () => clearTimeout(timer);
  }, [resetSuccess]);

  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      {resetSuccess && (
        <Alert
          variant="success"
          isInline
          title="Password reset successfully."
          actionClose={<AlertActionCloseButton onClose={() => setResetSuccess(false)} />}
          className={styles.assignSuccessAlert}
        />
      )}
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
              <td>{credential.createdAt ? new Date(credential.createdAt).toLocaleString() : '—'}</td>
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
  { key: 'groupName', label: 'Name', render: (row) => row.groupName },
  { key: 'description', label: 'Description', render: (row) => row.description || '—' },
];

// Step 5 - Permission Groups tab, backed by the existing GET
// /users/{username}/permission-groups plus the groups feature's own
// POST /groups/{groupName}/users and DELETE /groups/{groupName}/users/{username}
// (PermissionController#addUsersToGroup / #removeUserFromGroup) - reused
// as-is from groups/api.js rather than duplicated, since they already do
// exactly this from the group's side (GroupDetailPage's Members tab). Same
// DataTable + tabActionsRow + ActionsMenu shape as the Roles tab above; no
// "Path"/"Direct membership" columns since fetchUserPermissionGroups has
// no hierarchy data for a user, same reasoning as Roles' missing
// "Inherited" column.
function PermissionGroupsTab({ username }) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInputRaw] = useState('');
  const [dropdownClosed, setDropdownClosed] = useState(false);
  const searchWrapperRef = useRef(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState(null); // null | groupName
  const [leaveError, setLeaveError] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [quickJoinTarget, setQuickJoinTarget] = useState(null); // null | groupName
  const [quickJoinError, setQuickJoinError] = useState(null);
  const [isQuickJoining, setIsQuickJoining] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Same search-catalog + dropdown pattern as RolesTab's own: typing always
  // reopens the dropdown; only a selection or an outside click closes it.
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

  // Same shrink-wrap + auto-fade treatment as RolesTab's own assignSuccessAlert.
  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(null), 1000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery({
    queryKey: ['users', username, 'permission-groups'],
    queryFn: () => getUserPermissionGroups(username),
  });

  const groups = data ?? [];
  const joinedGroupNames = useMemo(() => new Set(groups.map((group) => group.groupName)), [groups]);

  // Full group catalog, fetched lazily like RolesTab's own catalog query -
  // only once the user starts typing - to find groups to join, decoupled
  // from the (already-joined) rows the table below shows.
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
    setSuccessMessage(groupName ? `Added ${username} to "${groupName}".` : 'Added to permission group successfully.');
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
      setSuccessMessage(`Added ${username} to "${quickJoinTarget}".`);
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
      {successMessage && (
        <Alert
          variant="success"
          isInline
          title={successMessage}
          actionClose={<AlertActionCloseButton onClose={() => setSuccessMessage(null)} />}
          className={styles.assignSuccessAlert}
        />
      )}

      <div className={styles.tabActionsRow}>
        {/* styles.roleDropdown* classes are RolesTab's own dropdown styles,
            reused as-is - same generic anchored-search-dropdown look, not
            role-specific despite the name. */}
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

// Step - "Logout all sessions" action, reusing the same
// DELETE /users/{username}/sessions?clientId=... the standalone Sessions -
// List screen's own Revoke action already calls (revokeSession).
// The upstream endpoint invalidates the user's active session(s) as a
// whole - there's no per-row/per-session id to target - so this is one
// bulk action above the table, matching Keycloak's own placement, rather
// than a per-row action.
function SessionsTab({ username, clientId }) {
  const queryClient = useQueryClient();
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

  const rows = data?.content ?? [];

  // No search param on this endpoint (unlike the standalone Sessions list's
  // ipAddress/device filters) - it always returns the user's full session
  // history in one page, so filtering by IP/device happens client-side,
  // same as GroupsListPage's own search over its unpaginated listGroups().
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

  if (isLoading || isError) {
    return (
      <div className={styles.pageBody}>
        <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
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
    </div>
  );
}

import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import Sidebar from '../shared/components/Sidebar';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';
import { useAuth } from '../shared/lib/authContext';
import ClientsListPage from '../features/clients/ClientsListPage';
import ClientDetailPage from '../features/clients/ClientDetailPage';
import UsersListPage from '../features/users/UsersListPage';
import UserDetailPage from '../features/users/UserDetailPage';
import RolesListPage from '../features/roles/RolesListPage';
import RoleDetailPage from '../features/roles/RoleDetailPage';
import GroupsTreePage from '../features/groups/GroupsTreePage';
import SessionsListPage from '../features/sessions/SessionsListPage';
import SettingsPage from '../features/settings/SettingsPage';
import styles from './App.module.css';

// Step 5A/5B - auth screens get their own layout (no Sidebar - an
// unauthenticated visitor shouldn't see the internal nav). Real gating of
// the app-shell routes is Step 5E, not yet built.
function AuthLayout() {
  return (
    <div className={styles.authShell}>
      <Outlet />
    </div>
  );
}

function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

// Step 5E - route guarding. Asks the BFF (via useAuth's GET /bff/auth/me,
// Step 4F) whether the httpOnly session cookie is still valid; there is
// nothing client-side to check instead. While that's in flight, render
// nothing rather than flashing AppShell for a moment - once it resolves,
// an unauthenticated visitor is sent to Login instead of ever reaching the
// nav/content underneath.
function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/clients" element={<ClientsListPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/:username" element={<UserDetailPage />} />
            <Route path="/roles" element={<RolesListPage />} />
            <Route path="/roles/:id" element={<RoleDetailPage />} />
            <Route path="/groups" element={<GroupsTreePage />} />
            <Route path="/sessions" element={<SessionsListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

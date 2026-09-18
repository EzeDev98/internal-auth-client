import '@patternfly/react-core/dist/styles/base.css';
import '../shared/patternfly-overrides.css';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import Sidebar from '../shared/components/Sidebar';
import Header from '../shared/components/Header';
import AnimatedOutlet from '../shared/components/AnimatedOutlet';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';
import { useAuth } from '../shared/lib/authContext';
import ClientsListPage from '../features/clients/ClientsListPage';
import CreateClientPage from '../features/clients/CreateClientPage';
import ClientDetailPage from '../features/clients/ClientDetailPage';
import UsersListPage from '../features/users/UsersListPage';
import CreateUserPage from '../features/users/CreateUserPage';
import UserDetailPage from '../features/users/UserDetailPage';
import RolesListPage from '../features/roles/RolesListPage';
import CreateRolePage from '../features/roles/CreateRolePage';
import RoleDetailPage from '../features/roles/RoleDetailPage';
import GroupsListPage from '../features/groups/GroupsListPage';
import CreateGroupPage from '../features/groups/CreateGroupPage';
import GroupDetailPage from '../features/groups/GroupDetailPage';
import WelcomePage from '../features/home/WelcomePage';
import SessionsListPage from '../features/sessions/SessionsListPage';
import SettingsPage from '../features/settings/SettingsPage';
import styles from './App.module.css';

// Step 5A/5B - auth screens get their own layout (no Sidebar - an
// unauthenticated visitor shouldn't see the internal nav). Real gating of
// the app-shell routes is Step 5E, not yet built.
function AuthLayout() {
  return (
    <div className={styles.authShell}>
      <AnimatedOutlet />
    </div>
  );
}

function AppShell() {
  return (
    <div className={styles.shell}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.content}>
          <AnimatedOutlet />
        </main>
      </div>
    </div>
  );
}

// Step 5E - route guarding. Asks the BFF (via useAuth's GET /bff/auth/me,
// Step 4F) whether the httpOnly session cookie is still valid; there is
// nothing client-side to check instead. While that's in flight, render
// nothing rather than flashing AppShell for a moment - once it resolves,
// an unauthenticated visitor is sent to Login instead of ever reaching
// the nav/content underneath.
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
            <Route path="/" element={<WelcomePage />} />
            <Route path="/clients" element={<ClientsListPage />} />
            <Route path="/clients/create" element={<CreateClientPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/create" element={<CreateUserPage />} />
            <Route path="/users/:username" element={<UserDetailPage />} />
            <Route path="/roles" element={<RolesListPage />} />
            <Route path="/roles/create" element={<CreateRolePage />} />
            <Route path="/roles/:id" element={<RoleDetailPage />} />
            <Route path="/groups" element={<GroupsListPage />} />
            <Route path="/groups/create" element={<CreateGroupPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/sessions" element={<SessionsListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

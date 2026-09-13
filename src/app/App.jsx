import '@patternfly/react-core/dist/styles/base.css';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Sidebar from '../shared/components/Sidebar';
import DataTable from '../shared/components/DataTable';
import Tabs from '../shared/components/Tabs';
import AppBreadcrumb from '../shared/components/Breadcrumb';
import Button from '../shared/components/Button';
import Badge from '../shared/components/Badge';
import Modal from '../shared/components/Modal';
import ActionsMenu from '../shared/components/ActionsMenu';
import RegisterPage from '../features/auth/RegisterPage';
import styles from './App.module.css';

function ComingSoon({ label }) {
  return <div className={styles.pageBody}>{label} - coming soon.</div>;
}

// Temporary Step 4 primitive demo (Sidebar + DataTable + ActionsMenu
// exercised together with fake rows) - gets replaced outright by Step 7's
// real Users feature. Not wired to any API.
const DEMO_ROWS = [
  { id: 1, username: 'admin', email: 'admin@wm.example', enabled: true },
  { id: 2, username: 'jane.doe', email: 'jane@wm.example', enabled: true },
  { id: 3, username: 'legacy.bot', email: 'bot@wm.example', enabled: false },
];
const DEMO_COLUMNS = [
  { key: 'username', label: 'Username', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'enabled', label: 'Enabled', render: (row) => (row.enabled ? 'Yes' : 'No') },
  {
    key: 'actions',
    label: '',
    render: (row) => (
      <ActionsMenu
        ariaLabel={`Actions for ${row.username}`}
        items={[
          { key: 'edit', label: 'Edit', onClick: () => {} },
          { key: 'delete', label: 'Delete', isDanger: true, onClick: () => {} },
        ]}
      />
    ),
  },
];

function UsersDemo() {
  const [sortBy, setSortBy] = useState({ index: 0, direction: 'asc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const sortedRows = [...DEMO_ROWS].sort((a, b) => {
    const key = DEMO_COLUMNS[sortBy.index]?.key;
    const dir = sortBy.direction === 'asc' ? 1 : -1;
    return String(a[key]).localeCompare(String(b[key])) * dir;
  });

  return (
    <div className={styles.pageBody}>
      <DataTable
        ariaLabel="Users (demo)"
        columns={DEMO_COLUMNS}
        rows={sortedRows}
        sortBy={sortBy}
        onSort={(index, direction) => setSortBy({ index, direction })}
        page={page}
        perPage={perPage}
        itemCount={sortedRows.length}
        onSetPage={(_event, newPage) => setPage(newPage)}
        onPerPageSelect={(_event, newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
      />
    </div>
  );
}

// Temporary Step 4 primitive demo (Breadcrumb + Tabs exercised together) -
// gets replaced outright by Step 8's real Role details screen.
function RolesDemo() {
  return (
    <div className={styles.pageBody}>
      <AppBreadcrumb items={[{ label: 'Roles', to: '/roles' }, { label: 'Role details' }]} />
      <Tabs
        ariaLabel="Role details (demo)"
        tabs={[
          { key: 'overview', title: 'Overview', content: 'Role overview goes here.' },
          { key: 'permissions', title: 'Permissions', content: 'Permission groups go here.' },
          { key: 'users', title: 'Users', content: 'Assigned users go here.' },
        ]}
      />
    </div>
  );
}

// Temporary Step 4 primitive demo (Button + Badge + Modal) - gets replaced
// outright by Step 11's real Settings screen.
function SettingsDemo() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.pageBody}>
      <p>
        Signing keys <Badge>2 active</Badge>
      </p>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Rotate signing key
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Rotate signing key?"
        footer={
          <>
            <Button variant="danger" onClick={() => setIsOpen(false)}>
              Rotate
            </Button>
            <Button variant="link" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        This immediately invalidates tokens signed with the current key.
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.shell}>
        <Sidebar />
        <main className={styles.content}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/clients" element={<ComingSoon label="Clients" />} />
            <Route path="/users" element={<UsersDemo />} />
            <Route path="/roles" element={<RolesDemo />} />
            <Route path="/groups" element={<ComingSoon label="Groups" />} />
            <Route path="/sessions" element={<ComingSoon label="Sessions" />} />
            <Route path="/settings" element={<SettingsDemo />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// Main navigation sidebar.
import { Nav, NavList, NavItem } from '@patternfly/react-core';
import { NavLink, useLocation } from 'react-router';
import {
  CubeIcon,
  UsersIcon,
  KeyIcon,
  LayerGroupIcon,
  HistoryIcon,
  CogIcon,
} from '@patternfly/react-icons';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/clients', label: 'Clients', Icon: CubeIcon },
  { to: '/users', label: 'Users', Icon: UsersIcon },
  { to: '/roles', label: 'Roles', Icon: KeyIcon },
  { to: '/groups', label: 'Groups', Icon: LayerGroupIcon },
  { to: '/sessions', label: 'Sessions', Icon: HistoryIcon },
  { to: '/settings', label: 'Settings', Icon: CogIcon },
];

export default function Sidebar({ isNavOpen = false, onClose }) {
  const { pathname } = useLocation();
  const sidebarClassName = isNavOpen
    ? `${styles.sidebar} ${styles.expanded}`
    : styles.sidebar;

  return (
    <>
      <div
        className={`${styles.backdrop} ${isNavOpen ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={sidebarClassName}>
        <Nav aria-label="Primary navigation" theme="dark">
          <NavList>
            {NAV_ITEMS.map(({ to, label, Icon }) => {
              const isActive = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <NavItem key={to} isActive={isActive}>
                  <NavLink to={to} aria-label={label}>
                    <Icon className={styles.navIcon} aria-hidden="true" />
                    <span className={styles.navLabel}>{label}</span>
                  </NavLink>
                </NavItem>
              );
            })}
          </NavList>
        </Nav>
      </aside>
    </>
  );
}

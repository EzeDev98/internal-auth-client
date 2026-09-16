import { Nav, NavList, NavItem } from '@patternfly/react-core';
import { NavLink, useLocation } from 'react-router';
import styles from './Sidebar.module.css';

// Step 4A - the six confirmed nav items (Step 1 decisions), styled per
// Step 1E's design tokens (shared/tokens.css).
//
// Styling note: PatternFly's NavItem clones its child and overwrites
// whatever className prop you give the child with its own computed string
// (see NavItem.js's renderClonedChild) - so a react-router NavLink's
// function-form className prop never actually runs; it just gets replaced.
// Rather than fight that, this styles PatternFly's own emitted
// ".pf-v6-c-nav__link" class directly, combined with the literal "active"
// class react-router's NavLink always appends when its plain-string
// className path is taken (see react-router's dom/lib.js NavLink) - which
// is exactly the path NavItem's clone forces it onto regardless of what we
// originally passed.
const NAV_ITEMS = [
  { to: '/clients', label: 'Clients' },
  { to: '/users', label: 'Users' },
  { to: '/roles', label: 'Roles' },
  { to: '/groups', label: 'Groups' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className={styles.sidebar}>
      <Nav aria-label="Primary navigation" theme="dark">
        <NavList>
          {NAV_ITEMS.map(({ to, label }) => {
            const isActive = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <NavItem key={to} isActive={isActive}>
                <NavLink to={to}>{label}</NavLink>
              </NavItem>
            );
          })}
        </NavList>
      </Nav>
    </aside>
  );
}

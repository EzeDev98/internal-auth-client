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
//
// Responsive plan - iPad Step 1b - sidebar strategy decision: collapse to a
// ~64px icon rail at max-width: 1024px instead of hiding the sidebar
// outright. iPad is typically held two-handed or propped up, so persistent
// nav is worth more here than on a phone (which goes fully off-canvas in
// the Mobile phase - see Mobile Step 2a). Rail is implemented below (Step
// 2a); the icon-per-item requirement it depends on was resolved at Step 1c.
//
// Responsive plan - iPad Step 1c - rail buildability check: the plan
// assumed @patternfly/react-icons was already a dependency; it wasn't
// listed directly in package.json (only @patternfly/react-core and
// @patternfly/react-table were), though it already resolved as a
// transitive dependency of those two and Header.jsx already imports from
// it directly. Decision: list it as an explicit dependency and use real
// icons per item (not a first-letter rail - Sessions/Settings collide on
// "S"), following Header.jsx's existing import pattern.
const NAV_ITEMS = [
  { to: '/clients', label: 'Clients', Icon: CubeIcon },
  { to: '/users', label: 'Users', Icon: UsersIcon },
  { to: '/roles', label: 'Roles', Icon: KeyIcon },
  { to: '/groups', label: 'Groups', Icon: LayerGroupIcon },
  { to: '/sessions', label: 'Sessions', Icon: HistoryIcon },
  { to: '/settings', label: 'Settings', Icon: CogIcon },
];

// Responsive plan - iPad Step 2a - isNavOpen (lifted to AppShell in
// App.jsx) only matters at <=1024px: false is the default rail/off-canvas
// state driven purely by Sidebar.module.css's media query; true means the
// user toggled the nav back open despite the narrow viewport (the toggle
// button itself is iPad Step 2b). Above 1024px this prop has no effect -
// the media query it depends on doesn't apply there.
export default function Sidebar({ isNavOpen = false, onClose }) {
  const { pathname } = useLocation();
  const sidebarClassName = isNavOpen
    ? `${styles.sidebar} ${styles.expanded}`
    : styles.sidebar;

  return (
    <>
      {/* Responsive plan - Mobile Step 2a - tap-to-close backdrop, only
          shown/positioned below 768px (Sidebar.module.css). Reuses
          Modal.jsx's fixed-overlay + fade idea, not the Modal component
          itself, since this lives outside any PFModal. Always in the DOM
          (visibility toggled by .backdropVisible) so it can fade instead
          of popping. */}
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

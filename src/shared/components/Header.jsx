import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Dropdown, DropdownList, DropdownItem, MenuToggle } from '@patternfly/react-core';
import { BarsIcon, CaretDownIcon, UserIcon } from '@patternfly/react-icons';
import { useAuth } from '../lib/authContext';
import logo from '../../assets/sidebar-logo-white.png';
import styles from './Header.module.css';

// Full-width bar above Sidebar+content, styled after Keycloak's own admin
// header (darker than the sidebar, --header-bg in tokens.css). Owns the
// account dropdown - "Log out" moved here from Sidebar's standalone
// button to match that "username toggle -> menu -> Sign out" pattern.
//
// Responsive plan - iPad Step 2b - isNavOpen/onToggleNav come from
// AppShell (App.jsx), which owns the single shared boolean the Sidebar
// rail also reads (iPad Step 2a). This button doesn't hold its own
// open/closed state, it only flips the shared one. Visible at <=1024px
// only (Header.module.css); at that width it toggles Sidebar between the
// collapsed 64px rail and the full 240px sidebar. .brandText is hidden
// below 480px by Mobile Step 2c (Header.module.css) - the header runs
// out of room there once the account toggle's fixed-width elements are
// counted; this file needed no change for that, CSS only.
export default function Header({ isNavOpen = false, onToggleNav }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Button
          variant="plain"
          className={styles.navToggle}
          aria-label="Toggle navigation"
          aria-expanded={isNavOpen}
          onClick={() => onToggleNav?.((open) => !open)}
        >
          <BarsIcon />
        </Button>
        <img src={logo} alt="" className={styles.logo} />
        <span className={styles.brandText}>Internal Auth</span>
      </div>
      <Dropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        popperProps={{ position: 'right' }}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            variant="plain"
            className={styles.toggle}
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
          >
            <span className={styles.toggleText}>{user?.username ?? 'Account'}</span>
            <CaretDownIcon className={styles.toggleCaret} />
            {/* Placeholder circle for a future profile picture - swap the
                UserIcon for a user-uploaded <img> once that exists. */}
            <span className={styles.avatar}>
              <UserIcon className={styles.avatarIcon} />
            </span>
          </MenuToggle>
        )}
      >
        <DropdownList>
          <DropdownItem key="logout" onClick={handleLogout}>
            Log out
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </header>
  );
}

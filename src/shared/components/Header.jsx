import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dropdown, DropdownList, DropdownItem, MenuToggle } from '@patternfly/react-core';
import { CaretDownIcon, UserIcon } from '@patternfly/react-icons';
import { useAuth } from '../lib/authContext';
import logo from '../../assets/sidebar-logo-white.png';
import styles from './Header.module.css';

// Full-width bar above Sidebar+content, styled after Keycloak's own admin
// header (darker than the sidebar, --header-bg in tokens.css). Owns the
// account dropdown - "Log out" moved here from Sidebar's standalone
// button to match that "username toggle -> menu -> Sign out" pattern.
export default function Header() {
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

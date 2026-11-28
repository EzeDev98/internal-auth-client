// Top bar with the app title and user menu.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Dropdown, DropdownList, DropdownItem, MenuToggle } from '@patternfly/react-core';
import { BarsIcon, CaretDownIcon, UserIcon } from '@patternfly/react-icons';
import { useAuth } from '../lib/useAuth';
import logo from '../../assets/sidebar-logo-white.png';
import styles from './Header.module.css';

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

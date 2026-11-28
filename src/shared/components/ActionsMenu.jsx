// Kebab menu of row actions.
import { useState } from 'react';
import { Dropdown, DropdownList, DropdownItem, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import styles from './ActionsMenu.module.css';

export default function ActionsMenu({ items, ariaLabel = 'Actions' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={() => setIsOpen(false)}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={ariaLabel}
          variant="plain"
          size="sm"
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          className={styles.toggle}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        {items.map((item) => (
          <DropdownItem key={item.key} onClick={item.onClick} isDanger={item.isDanger} isDisabled={item.isDisabled}>
            {item.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

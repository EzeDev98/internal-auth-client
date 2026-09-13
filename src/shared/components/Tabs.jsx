import { useState } from 'react';
import { Tabs as PFTabs, Tab, TabTitleText } from '@patternfly/react-core';
import styles from './Tabs.module.css';

// Step 4C - used by the Users and Roles detail screens. Uncontrolled by
// default (tracks its own activeKey internally); pass `activeKey` +
// `onChange` to control it from the parent instead.
export default function Tabs({ tabs, defaultActiveKey, activeKey: activeKeyProp, onChange, ariaLabel = 'Tabs' }) {
  const [internalKey, setInternalKey] = useState(defaultActiveKey ?? tabs[0]?.key);
  const isControlled = activeKeyProp !== undefined;
  const activeKey = isControlled ? activeKeyProp : internalKey;

  const handleSelect = (_event, eventKey) => {
    if (!isControlled) {
      setInternalKey(eventKey);
    }
    onChange?.(eventKey);
  };

  return (
    <PFTabs activeKey={activeKey} onSelect={handleSelect} aria-label={ariaLabel} className={styles.tabs}>
      {tabs.map(({ key, title, content }) => (
        <Tab key={key} eventKey={key} title={<TabTitleText>{title}</TabTitleText>}>
          <div className={styles.panel}>{content}</div>
        </Tab>
      ))}
    </PFTabs>
  );
}

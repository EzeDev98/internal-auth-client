import { Button as PFButton } from '@patternfly/react-core';
import styles from './Button.module.css';

// Step 4E - thin wrapper so every button in the app goes through one place
// for the Step 1E radius token. PatternFly v6's own default is a 999px
// pill shape (verified by rendering it), not the plan's flat 6px applied
// everywhere - Button.module.css overrides that.
export default function Button({ className, ...props }) {
  return <PFButton className={[styles.button, className].filter(Boolean).join(' ')} {...props} />;
}

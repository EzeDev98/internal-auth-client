import { Badge as PFBadge } from '@patternfly/react-core';
import styles from './Badge.module.css';

// Step 4E - same rationale as Button.jsx: overrides PatternFly v6's default
// 999px pill radius down to the Step 1E token.
export default function Badge({ className, ...props }) {
  return <PFBadge className={[styles.badge, className].filter(Boolean).join(' ')} {...props} />;
}

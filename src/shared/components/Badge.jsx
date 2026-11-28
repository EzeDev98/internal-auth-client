// Styled status badge.
import { Badge as PFBadge } from '@patternfly/react-core';
import styles from './Badge.module.css';

export default function Badge({ className, ...props }) {
  return <PFBadge className={[styles.badge, className].filter(Boolean).join(' ')} {...props} />;
}

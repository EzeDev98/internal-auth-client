// Shared button wrapper used across the app.
import { Button as PFButton } from '@patternfly/react-core';
import styles from './Button.module.css';

export default function Button({ className, ...props }) {
  return <PFButton className={[styles.button, className].filter(Boolean).join(' ')} {...props} />;
}

// Password field with a show and hide toggle.
import { useState } from 'react';
import { TextInput } from '@patternfly/react-core';
import styles from './PasswordInput.module.css';

export default function PasswordInput({ id, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrapper}>
      <TextInput id={id} type={visible ? 'text' : 'password'} className={styles.input} {...rest} />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.36 5.22A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7.5a12.07 12.07 0 01-3.22 4.32M6.6 6.6C4.4 8.06 2.7 10.1 1 12.5 2.73 16.89 7 20 12 20a10.9 10.9 0 004.24-.86"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M1 12.5C2.73 8.11 7 5 12 5s9.27 3.11 11 7.5C21.27 16.89 17 20 12 20S2.73 16.89 1 12.5z"
            />
            <circle cx="12" cy="12.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        )}
      </button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Modal as PFModal, ModalHeader, ModalBody, ModalFooter } from '@patternfly/react-core';
import styles from './Modal.module.css';

// Step 4E - generic modal shell (confirmation dialogs, simple forms).
// `footer` is typically one or two <Button>s (Confirm/Cancel).
//
// UX smoothness plan Step 4c - the one shared modal open/close animation,
// added directly here so every call site in the app picks it up with no
// per-modal changes. PatternFly's own Modal has no exit-animation support:
// it unmounts the instant `isOpen` flips to false, so there is nothing to
// transition off of by default. This keeps the modal mounted for
// CLOSE_DURATION_MS after `isOpen` goes false so the closing animation has
// time to play before the real unmount happens - same "hold, then remove"
// technique AnimatedOutlet.jsx (Step 4b) uses for route transitions.
const CLOSE_DURATION_MS = 150;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = 'small',
  ariaLabel,
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return undefined;
    }

    if (!shouldRender) {
      return undefined;
    }

    setIsClosing(true);
    const timeoutId = setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, CLOSE_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [isOpen, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <PFModal
      isOpen
      onClose={onClose}
      variant={variant}
      aria-label={title ? undefined : ariaLabel}
      className={[styles.modal, isClosing ? styles.closing : styles.opening].filter(Boolean).join(' ')}
      backdropClassName={isClosing ? styles.backdropClosing : styles.backdropOpening}
    >
      <ModalHeader title={title} />
      <ModalBody>{children}</ModalBody>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </PFModal>
  );
}

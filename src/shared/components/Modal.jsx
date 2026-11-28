// Generic modal shell for dialogs and simple forms.
import { useEffect, useState } from 'react';
import { Modal as PFModal, ModalHeader, ModalBody, ModalFooter } from '@patternfly/react-core';
import styles from './Modal.module.css';

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

  if (isOpen && (!shouldRender || isClosing)) {
    setShouldRender(true);
    setIsClosing(false);
  } else if (!isOpen && shouldRender && !isClosing) {
    setIsClosing(true);
  }

  useEffect(() => {
    if (!isClosing) return undefined;

    const timeoutId = setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, CLOSE_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [isClosing]);

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

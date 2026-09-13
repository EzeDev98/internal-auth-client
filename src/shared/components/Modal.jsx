import { Modal as PFModal, ModalHeader, ModalBody, ModalFooter } from '@patternfly/react-core';
import styles from './Modal.module.css';

// Step 4E - generic modal shell (confirmation dialogs, simple forms).
// `footer` is typically one or two <Button>s (Confirm/Cancel).
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = 'small',
  ariaLabel,
}) {
  return (
    <PFModal
      isOpen={isOpen}
      onClose={onClose}
      variant={variant}
      aria-label={title ? undefined : ariaLabel}
      className={styles.modal}
    >
      <ModalHeader title={title} />
      <ModalBody>{children}</ModalBody>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </PFModal>
  );
}

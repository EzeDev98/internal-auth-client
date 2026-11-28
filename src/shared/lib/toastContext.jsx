// Toast provider that renders notifications across the app.
import {
  useCallback, useMemo, useRef, useState,
} from 'react';
import { AlertGroup, Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { ToastContext } from './useToast';

const DEFAULT_TIMEOUT_MS = 6000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((variant, title, options = {}) => {
    const { timeout = DEFAULT_TIMEOUT_MS } = options;
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current, {
      id, variant, title, timeout,
    }]);
    return id;
  }, []);

  const toast = useMemo(() => ({
    success: (title, options) => show('success', title, options),
    danger: (title, options) => show('danger', title, options),
    warning: (title, options) => show('warning', title, options),
    info: (title, options) => show('info', title, options),
    dismiss,
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <AlertGroup isToast isLiveRegion>
        {toasts.map(({
          id, variant, title, timeout,
        }) => (
          <Alert
            key={id}
            variant={variant}
            title={title}
            timeout={timeout}
            onTimeout={() => dismiss(id)}
            actionClose={<AlertActionCloseButton onClose={() => dismiss(id)} />}
          />
        ))}
      </AlertGroup>
    </ToastContext.Provider>
  );
}

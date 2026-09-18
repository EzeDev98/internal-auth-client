import {
  createContext, useCallback, useContext, useMemo, useRef, useState,
} from 'react';
import { AlertGroup, Alert, AlertActionCloseButton } from '@patternfly/react-core';

// UX smoothness plan Step 4a - the one central toast implementation for the
// whole app. Every page/modal that needs a success or error confirmation
// calls useToast() from here instead of hand-rolling its own inline Alert +
// setTimeout (see UserDetailPage.jsx's RolesTab/PermissionGroupsTab/
// CredentialsTab - plan Steps 8d/8e/8f - for the three places that pattern
// was duplicated before this existed). Mirrors authContext.jsx's
// createContext + throw-if-missing shape. Not mounted anywhere yet - that's
// plan Step 5a, which wraps the app with <ToastProvider> once.
//
// Note on the "Step 4a" tag above: it refers to this UX smoothness plan's
// own step numbering, not this codebase's older Step 1-12 build-plan
// comments (e.g. Button.jsx's "Step 4E") - the two are separate sequences
// that happen to share some numbers.
const ToastContext = createContext(null);

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

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

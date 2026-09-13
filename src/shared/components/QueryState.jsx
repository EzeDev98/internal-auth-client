import { Bullseye, Spinner, Alert } from '@patternfly/react-core';
import Button from './Button';
import styles from './QueryState.module.css';

// Step 12B - every list/detail screen was gating its content on
// isLoading/isError in its own slightly different way (a bare "Loading..."
// string here, DataTable's emptyStateMessage prop there, an Alert with no
// wrapper somewhere else). This is the one shared shape all of them use
// now: a centered Spinner while loading, a danger Alert (with a "Try
// again" retry wired to the query's own refetch, when the caller passes
// one) on error, and the real content only once both are false. children
// is a plain node, not a render prop - React elements are cheap to
// construct and aren't executed until actually rendered, so it's safe for
// a caller to pass e.g. <DataTable rows={data ?? []} .../> here even while
// isLoading is still true.
export default function QueryState({
  isLoading,
  isError,
  error,
  onRetry,
  loadingLabel = 'Loading...',
  children = null,
}) {
  if (isLoading) {
    return (
      <Bullseye className={styles.bullseye}>
        <Spinner aria-label={loadingLabel} />
      </Bullseye>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger" title={error?.message ?? 'Something went wrong.'} className={styles.alert}>
        {onRetry && (
          <Button variant="link" isInline onClick={onRetry}>
            Try again
          </Button>
        )}
      </Alert>
    );
  }

  return children;
}

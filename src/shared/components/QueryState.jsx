// Renders loading, error or content for a query.
import { Bullseye, Spinner, Alert } from '@patternfly/react-core';
import Button from './Button';
import styles from './QueryState.module.css';

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

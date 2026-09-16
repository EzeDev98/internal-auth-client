import {
  EmptyState as PFEmptyState, EmptyStateBody, EmptyStateFooter, EmptyStateActions,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import Button from './Button';
import styles from './EmptyState.module.css';

export default function EmptyState({
  title, body, actionLabel, onAction, icon: Icon = PlusCircleIcon,
}) {
  return (
    <PFEmptyState headingLevel="h4" icon={Icon} titleText={title} className={styles.emptyState}>
      {body && <EmptyStateBody>{body}</EmptyStateBody>}
      {actionLabel && onAction && (
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      )}
    </PFEmptyState>
  );
}

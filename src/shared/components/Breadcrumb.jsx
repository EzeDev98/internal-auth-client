// Breadcrumb trail for detail screens.
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { Link } from 'react-router';
import styles from './Breadcrumb.module.css';

export default function AppBreadcrumb({ items }) {
  return (
    <Breadcrumb className={styles.breadcrumb}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <BreadcrumbItem
            key={item.to ?? item.label}
            isActive={isLast}
            render={({ className, ariaCurrent }) =>
              isLast ? (
                <span className={className} aria-current={ariaCurrent}>
                  {item.label}
                </span>
              ) : (
                <Link className={className} to={item.to}>
                  {item.label}
                </Link>
              )
            }
          />
        );
      })}
    </Breadcrumb>
  );
}

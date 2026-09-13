import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { Link } from 'react-router';
import styles from './Breadcrumb.module.css';

// Step 4D - e.g. "Roles > Role details". Non-last items render as
// react-router Links via BreadcrumbItem's documented `render` prop (the
// supported customization hook - unlike PatternFly's NavItem, which clones
// and overwrites a child's own props; see Sidebar.jsx's comment on why that
// approach was dropped there). The last item is the current page: plain
// text, not a link.
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

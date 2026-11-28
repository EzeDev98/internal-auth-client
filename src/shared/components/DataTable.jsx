// Responsive data table with an empty state.
import { useEffect, useRef, useState } from 'react';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Pagination } from '@patternfly/react-core';
import styles from './DataTable.module.css';

function useScrollFade(scrollRef) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return undefined;
    }
    const tableEl = scrollEl.firstElementChild;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollEl;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    update();
    scrollEl.addEventListener('scroll', update, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(scrollEl);
    if (tableEl) {
      resizeObserver.observe(tableEl);
    }

    return () => {
      scrollEl.removeEventListener('scroll', update);
      resizeObserver.disconnect();
    };
  }, [scrollRef]);

  return { canScrollLeft, canScrollRight };
}

const DEFAULT_PER_PAGE_OPTIONS = [
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
];

export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  sortBy,
  onSort,
  page,
  perPage,
  itemCount,
  onSetPage,
  onPerPageSelect,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  ariaLabel = 'Data table',
  emptyStateMessage = 'No results found.',
  emptyState,
  isSearching = false,
  isCompact = false,
  simple = false,
}) {
  const getSortParams = (columnIndex) => ({
    sortBy,
    onSort: (_event, index, direction) => onSort?.(index, direction),
    columnIndex,
  });

  const scrollRef = useRef(null);
  const { canScrollLeft, canScrollRight } = useScrollFade(scrollRef);
  const scrollClassName = [
    styles.tableScroll,
    canScrollLeft ? styles.canScrollLeft : '',
    canScrollRight ? styles.canScrollRight : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      <div className={scrollClassName} ref={scrollRef}>
        <Table
          aria-label={ariaLabel}
          className={simple ? `${styles.table} ${styles.simpleTable}` : styles.table}
          variant={isCompact ? 'compact' : undefined}
          gridBreakPoint={simple ? '' : undefined}
        >
        <Thead>
          <Tr>
            {columns.map((column, index) => (
              <Th
                key={column.key}
                width={column.width}
                modifier={column.modifier}
                sort={column.sortable ? getSortParams(index) : undefined}
                screenReaderText={column.isAction && !column.label ? 'Actions' : undefined}
                className={column.isAction ? styles.actionsCell : undefined}
              >
                {column.label}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={columns.length}>
                {isSearching ? 'No results match your search.' : (emptyState ?? emptyStateMessage)}
              </Td>
            </Tr>
          ) : (
            rows.map((row) => (
              <Tr key={rowKey(row)}>
                {columns.map((column) => (
                  <Td
                    key={column.key}
                    dataLabel={column.label}
                    modifier={column.modifier}
                    className={column.isAction ? styles.actionsCell : undefined}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
      </div>

      {onSetPage && (
        <Pagination
          isCompact
          variant="bottom"
          page={page}
          perPage={perPage}
          itemCount={itemCount}
          perPageOptions={perPageOptions}
          onSetPage={onSetPage}
          onPerPageSelect={onPerPageSelect}
          className={styles.pagination}
        />
      )}
    </div>
  );
}

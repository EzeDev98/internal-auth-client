import { useEffect, useRef, useState } from 'react';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Pagination } from '@patternfly/react-core';
import styles from './DataTable.module.css';

// Responsive plan - Mobile Step 4a - edge-fade scroll affordance, gated
// on actual overflow rather than a blanket CSS mask (a static mask would
// fade the edge even on pages where every column already fits at phone
// width and there's nothing to scroll to). Reads scrollWidth/clientWidth
// off the .tableScroll div itself rather than taking a ref on <Table>,
// since this app doesn't otherwise depend on @patternfly/react-table's
// ref-forwarding - scrollEl.firstElementChild (the rendered <table> DOM
// node) is used directly for the second ResizeObserver instead, which
// works regardless of PatternFly's ref API.
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
      // 1px tolerance for sub-pixel rounding right at the scroll end.
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    update();
    scrollEl.addEventListener('scroll', update, { passive: true });

    // Two observers, not one: .tableScroll catches a viewport resize
    // (its own clientWidth changing); the <table> node catches
    // content/column-driven scrollWidth changes (e.g. data loading in
    // with a long value) that leave .tableScroll's own size untouched -
    // a plain scroll listener would miss both.
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
  // Opt-in alternative to PatternFly's default card-stacking on narrow
  // screens (Th/Td dataLabel + container-query grid mode). Meant for
  // tables with a couple of short columns (e.g. Name/Description) where
  // stacking into label:value pairs is overkill - renders as a plain
  // fixed-layout 2-column table instead, at every width. Also needed
  // whenever a column uses the 'truncate' or 'nowrap' modifier: those
  // force white-space: nowrap, which can blow the table's rendered
  // width past the grid mode's own container-query breakpoint and
  // force horizontal scrolling instead of stacking - simpleTable resets
  // that so long values wrap within the column instead.
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
              {/* isSearching means these rows are search-filtered from a
                  non-empty dataset - "no data at all" empty states (a rich
                  emptyState card with a Create CTA, or emptyStateMessage)
                  would be misleading here, so a plain no-matches message
                  always wins over either when a search is active. */}
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

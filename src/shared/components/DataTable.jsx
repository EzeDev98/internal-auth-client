import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Pagination } from '@patternfly/react-core';
import styles from './DataTable.module.css';

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
}) {
  const getSortParams = (columnIndex) => ({
    sortBy,
    onSort: (_event, index, direction) => onSort?.(index, direction),
    columnIndex,
  });

  return (
    <div className={styles.wrapper}>
      <Table aria-label={ariaLabel} className={styles.table} variant={isCompact ? 'compact' : undefined}>
        <Thead>
          <Tr>
            {columns.map((column, index) => (
              <Th
                key={column.key}
                width={column.width}
                modifier={column.modifier}
                sort={column.sortable ? getSortParams(index) : undefined}
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

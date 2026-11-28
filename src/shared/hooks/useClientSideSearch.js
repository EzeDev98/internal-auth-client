// Filters an already-loaded list by a search term.
import { useMemo } from 'react';

export default function useClientSideSearch(rows, searchInput, matchFn) {
  return useMemo(() => {
    const needle = searchInput.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => matchFn(row, needle));
  }, [rows, searchInput, matchFn]);
}

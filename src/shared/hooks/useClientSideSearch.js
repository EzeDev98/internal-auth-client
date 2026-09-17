import { useMemo } from 'react';

// Shared substring filter for lists that are already fully loaded client-side
// (Groups, Roles, Clients). `matchFn(row, needle)` decides which field(s)
// count as a match - keep it a stable module-level function (not an inline
// arrow) so this memoizes correctly instead of recomputing every render.
export default function useClientSideSearch(rows, searchInput, matchFn) {
  return useMemo(() => {
    const needle = searchInput.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => matchFn(row, needle));
  }, [rows, searchInput, matchFn]);
}

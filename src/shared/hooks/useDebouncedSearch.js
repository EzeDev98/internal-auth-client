import { useEffect, useState } from 'react';

// Shared debounce-into-a-committed-value logic for lists backed by a real
// network search param (Users, Sessions). `searchInput` updates on every
// keystroke for the SearchBar's own value; `search` only updates `delay`ms
// after typing stops, which is what queryKey should depend on. Callers that
// want page 1 on every new committed search can add their own
// `useEffect(() => setPage(1), [search])` - kept out of this hook since not
// every consumer of a debounced search value necessarily paginates.
export default function useDebouncedSearch(delay = 400) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const trimmed = searchInput.trim();
    const timeoutId = setTimeout(() => setSearch(trimmed), delay);
    return () => clearTimeout(timeoutId);
  }, [searchInput, delay]);

  // Still commits immediately on Enter/arrow-click, same as before.
  const handleSearchSubmit = (value) => setSearch(value.trim());

  return {
    searchInput, setSearchInput, search, handleSearchSubmit,
  };
}

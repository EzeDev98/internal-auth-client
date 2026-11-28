// Debounces a search term before it is sent to the server.
import { useEffect, useState } from 'react';

export default function useDebouncedSearch(delay = 400) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const trimmed = searchInput.trim();
    const timeoutId = setTimeout(() => setSearch(trimmed), delay);
    return () => clearTimeout(timeoutId);
  }, [searchInput, delay]);

  const handleSearchSubmit = (value) => setSearch(value.trim());

  return {
    searchInput, setSearchInput, search, handleSearchSubmit,
  };
}

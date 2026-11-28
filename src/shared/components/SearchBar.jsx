// Search input used by list screens.
import styles from './SearchBar.module.css';

export default function SearchBar({
  value, onChange, onSubmit, placeholder = 'Search', ariaLabel, className,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form
      className={[styles.searchGroup, className].filter(Boolean).join(' ')}
      role="search"
      onSubmit={handleSubmit}
    >
      <span className={styles.searchIcon} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="text"
        className={styles.searchField}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        name="search-no-autofill"
      />
      <button type="submit" className={styles.searchSubmit} aria-label="Submit search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}

import { useEffect, useRef, useState } from "react";
import { SearchField } from "./SearchField";
import styles from "./SearchSection.module.css";

interface SearchSectionProps {
  onSearchChange: (value: string) => void;
  initialValue?: string;
}

export function SearchSection({
  onSearchChange,
  initialValue = "",
}: SearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChangeRef.current(searchTerm);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <div className={styles.searchContainer}>
      <SearchField
        value={searchTerm}
        onChange={handleSearchChange}
        onClear={handleClear}
      />
    </div>
  );
}

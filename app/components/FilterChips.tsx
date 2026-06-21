import type { FilterChip } from "../types/FilterChip";

interface FilterChipsProps {
  filterChips: FilterChip[];
  activeFilters: string[];
  onFilterClick: (filterId: string) => void;
}

const filterChipStyle = (isActive: boolean) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
  border: "none",
  background: isActive ? "#F1F8F8" : "#F6F6F7",
  color: isActive ? "#38B2AC" : "#202223",
  width: "100%",
  justifyContent: "center",
  whiteSpace: "nowrap" as const,
  minWidth: "120px",
});

const containerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "8px",
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
};

export function FilterChips({
  filterChips,
  activeFilters,
  onFilterClick,
}: FilterChipsProps) {
  return (
    <div style={containerStyle}>
      {filterChips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onFilterClick(chip.id)}
          style={filterChipStyle(activeFilters.includes(chip.id))}
        >
          {chip.label}
          {chip.count !== undefined && ` (${chip.count})`}
        </button>
      ))}
    </div>
  );
}

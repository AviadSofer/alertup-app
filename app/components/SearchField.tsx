import { TextField, useMediaQuery } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SearchField({ value, onChange, onClear }: SearchFieldProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const searchWrapperStyle = {
    position: "relative" as const,
    width: isMobile ? "100%" : "240px",
  };

  const searchIconStyle = {
    color: "#8C9196",
    width: "16px",
    height: "16px",
  };

  return (
    <div style={searchWrapperStyle}>
      <TextField
        label=""
        labelHidden
        type="search"
        value={value}
        onChange={onChange}
        prefix={<SearchIcon style={searchIconStyle} />}
        placeholder="Search Products"
        clearButton
        onClearButtonClick={onClear}
        autoComplete="off"
        monospaced={false}
      />
    </div>
  );
}

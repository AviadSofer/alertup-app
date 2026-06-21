import { Select } from "@shopify/polaris";

interface TablePageSizeSelectorProps {
  pageSize: number;
  totalRows: number;
  onPageSizeChange: (value: string) => void;
}

export function TablePageSizeSelector({
  pageSize,
  totalRows,
  onPageSizeChange,
}: TablePageSizeSelectorProps) {
  return (
    <Select
      label="Display:"
      labelInline
      options={[
        { label: "5 products", value: "5" },
        { label: "10 products", value: "10" },
        { label: "20 products", value: "20" },
        { label: "50 products", value: "50" },
        { label: "All products", value: totalRows.toString() },
      ]}
      value={pageSize.toString()}
      onChange={onPageSizeChange}
    />
  );
}

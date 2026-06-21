import { DataTable as PolarisDataTable } from "@shopify/polaris";
import type { TableData, ColumnContentType } from "@shopify/polaris";
import type { ReactNode } from "react";

interface CustomDataTableProps {
  rows: TableData[][];
  headings: ReactNode[];
  columnContentTypes: ColumnContentType[];
  sortColumnIndex: number | null;
  onSort: (columnIndex: number) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

export function DataTable({
  rows,
  headings,
  columnContentTypes,
  sortColumnIndex,
  onSort,
  currentPage,
  totalPages,
  pageSize,
  totalRows,
  onPageChange,
}: CustomDataTableProps) {
  return (
    <div>
      <PolarisDataTable
        columnContentTypes={columnContentTypes}
        headings={headings}
        rows={rows}
        sortable={Array(headings.length).fill(true)}
        defaultSortDirection="ascending"
        initialSortColumnIndex={sortColumnIndex ?? undefined}
        onSort={onSort}
        pagination={{
          hasNext: currentPage < totalPages,
          hasPrevious: currentPage > 1,
          onNext: () => onPageChange(currentPage + 1),
          onPrevious: () => onPageChange(currentPage - 1),
          label: `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalRows)} of ${totalRows}`,
        }}
        hoverable
        stickyHeader
      />
    </div>
  );
}

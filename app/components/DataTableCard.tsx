import type { TableData, ColumnContentType } from "@shopify/polaris";
import { Tooltip } from "@shopify/polaris";
import { useEffect, useMemo, useState } from "react";
import { CollapsibleCard } from "./CollapsibleCard";
import { FilterChips } from "./FilterChips";
import { SearchSection } from "./SearchSection";
import { ExportButtons } from "./ExportButtons";
import { NoResultsState } from "./NoResultsState";
import { DataTable } from "./DataTable";
import { processRows } from "./TableRowProcessor";
import { sortRows } from "./TableSorter";
import { filterRows } from "./TableFilter";
import { TablePageSizeSelector } from "./TablePageSizeSelector";
import type { FilterChip } from "../types/FilterChip";
import { getInventoryCriteria } from "../services/analysis/inventory-categorization.service";
import { parseNumberFromDisplayValue } from "../lib/code-utils";

interface DataTableCardProps {
  columnContentTypes: ColumnContentType[];
  headings: string[];
  rows: TableData[][];
  tableName: string;
  variantColumnIndex?: number;
  titleColumnIndex?: number;
  imageColumnIndex?: number;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  showFilters?: boolean;
  productStatusColumnIndex?: number;
  isLoading?: boolean;
  inventoryDaysForStatus?: number;
}

const PRODUCT_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
  { label: "All Products", value: "ALL" },
];

const statusDropdownContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const statusDropdownLabelStyle = {
  fontSize: "14px",
  fontWeight: "500" as const,
  color: "#202223",
  whiteSpace: "nowrap" as const,
};

const statusDropdownStyle = {
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "500" as const,
  border: "1px solid #C9CCCF",
  background: "#FFFFFF",
  color: "#202223",
  cursor: "pointer",
  outline: "none",
};

const COLUMN_HELP_TEXT: Record<string, string> = {
  "🛒 Product": "Product title (variant shown as a tag when applicable).",
  Product: "Product title (variant shown as a tag when applicable).",
  "🗂 Variant": "Variant title for this product (if applicable).",
  "💰 Total Sold":
    "Total units sold within the selected sales analysis period.",
  "📅 Current Inventory": "Current on-hand inventory across locations.",
  "📈 Daily Rate": "Average units sold per day (based on the selected period).",
  "📝 Days Until Stockout":
    "Estimated days until stock runs out at the current sales rate.",
  "📊 Status": "Inventory health status based on inventory days coverage.",
  Status: "Inventory health status based on inventory days coverage.",
  "✅ Recommended Reorder":
    "Suggested units to order to cover the selected reorder period.",
  "Recommended Reorder":
    "Suggested units to order to cover the selected reorder period.",
};

const headingWrapperStyle = {
  display: "inline-flex",
  alignItems: "center",
};

export function DataTableCard({
  columnContentTypes,
  headings,
  rows,
  tableName,
  variantColumnIndex,
  titleColumnIndex = 0,
  imageColumnIndex,
  emptyStateMessage,
  emptyStateDescription,
  showFilters = false,
  productStatusColumnIndex,
  isLoading,
  inventoryDaysForStatus,
}: DataTableCardProps) {
  const [sortedRows, setSortedRows] = useState(rows);
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("ascending");
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);
  const [selectedProductStatus, setSelectedProductStatus] =
    useState<string>("ACTIVE");

  const criteria = useMemo(() => {
    return getInventoryCriteria(inventoryDaysForStatus);
  }, [inventoryDaysForStatus]);

  const hiddenColumnIndexes = useMemo(() => {
    const set = new Set<number>();
    if (productStatusColumnIndex !== undefined) {
      set.add(productStatusColumnIndex);
    }
    if (variantColumnIndex !== undefined) {
      set.add(variantColumnIndex);
    }
    return set;
  }, [productStatusColumnIndex, variantColumnIndex]);

  const visibleToOriginalColumnIndexes = useMemo(() => {
    return headings
      .map((_, index) => index)
      .filter((index) => !hiddenColumnIndexes.has(index));
  }, [headings, hiddenColumnIndexes]);

  useEffect(() => {
    if (sortColumnIndex === null) {
      setSortedRows(rows);
      return;
    }

    const originalColumnIndex = visibleToOriginalColumnIndexes[sortColumnIndex];
    if (originalColumnIndex === undefined) {
      setSortedRows(rows);
      return;
    }

    setSortedRows(
      sortRows(rows, {
        columnIndex: originalColumnIndex,
        direction: sortDirection,
      }),
    );
  }, [rows, sortColumnIndex, sortDirection, visibleToOriginalColumnIndexes]);

  // Filter rows by product status first
  const statusFilteredRows = useMemo(() => {
    if (
      productStatusColumnIndex === undefined ||
      selectedProductStatus === "ALL"
    ) {
      return rows;
    }
    return rows.filter(
      (row) => row[productStatusColumnIndex] === selectedProductStatus,
    );
  }, [rows, productStatusColumnIndex, selectedProductStatus]);

  // Also apply status filter to sorted rows
  const statusFilteredSortedRows = useMemo(() => {
    if (
      productStatusColumnIndex === undefined ||
      selectedProductStatus === "ALL"
    ) {
      return sortedRows;
    }
    return sortedRows.filter(
      (row) => row[productStatusColumnIndex] === selectedProductStatus,
    );
  }, [sortedRows, productStatusColumnIndex, selectedProductStatus]);

  const filterChips: FilterChip[] = [
    {
      id: "all",
      label: "All",
      isActive: activeFilters.includes("all"),
      count: statusFilteredRows.length,
    },
    {
      id: "running-low",
      label: "Running low",
      isActive: activeFilters.includes("running-low"),
      count: statusFilteredRows.filter((row) =>
        criteria.isRunningLow({
          currentInventory: parseNumberFromDisplayValue(row[4]),
          dailyRate: parseNumberFromDisplayValue(row[5]),
        }),
      ).length,
    },
    {
      id: "out-of-stock",
      label: "Out of stock",
      isActive: activeFilters.includes("out-of-stock"),
      count: statusFilteredRows.filter((row) =>
        criteria.isOutOfStock({
          currentInventory: parseNumberFromDisplayValue(row[4]),
          dailyRate: parseNumberFromDisplayValue(row[5]),
        }),
      ).length,
    },
    {
      id: "no-sales",
      label: "No sales",
      isActive: activeFilters.includes("no-sales"),
      count: statusFilteredRows.filter((row) =>
        criteria.isNoSales({
          currentInventory: parseNumberFromDisplayValue(row[4]),
          dailyRate: parseNumberFromDisplayValue(row[5]),
        }),
      ).length,
    },
    {
      id: "overstocked",
      label: "Overstocked",
      isActive: activeFilters.includes("overstocked"),
      count: statusFilteredRows.filter((row) =>
        criteria.isOverstocked({
          currentInventory: parseNumberFromDisplayValue(row[4]),
          dailyRate: parseNumberFromDisplayValue(row[5]),
        }),
      ).length,
    },
    {
      id: "healthy",
      label: "Healthy",
      isActive: activeFilters.includes("healthy"),
      count: statusFilteredRows.filter((row) =>
        criteria.isHealthy({
          currentInventory: parseNumberFromDisplayValue(row[4]),
          dailyRate: parseNumberFromDisplayValue(row[5]),
        }),
      ).length,
    },
  ];

  const handleFilterClick = (filterId: string) => {
    if (filterId === "all") {
      setActiveFilters(["all"]);
    } else {
      const newFilters = activeFilters.includes("all")
        ? [filterId]
        : activeFilters.includes(filterId)
          ? activeFilters.filter((f) => f !== filterId)
          : [...activeFilters, filterId];

      setActiveFilters(newFilters.length === 0 ? ["all"] : newFilters);
    }
    setCurrentPage(1);
  };

  const handleProductStatusChange = (value: string) => {
    setSelectedProductStatus(value);
    setCurrentPage(1);
  };

  const filteredRows = useMemo(() => {
    return filterRows(statusFilteredSortedRows, {
      searchTerm,
      titleColumnIndex,
      variantColumnIndex,
      activeFilters,
      inventoryDaysForStatus,
    });
  }, [
    statusFilteredSortedRows,
    searchTerm,
    titleColumnIndex,
    variantColumnIndex,
    activeFilters,
    inventoryDaysForStatus,
  ]);

  const totalRows = filteredRows.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortByColumn = (columnIndex: number) => {
    const newDirection =
      sortColumnIndex === columnIndex && sortDirection === "ascending"
        ? "descending"
        : "ascending";

    setSortDirection(newDirection);
    setSortColumnIndex(columnIndex);

    const originalColumnIndex = visibleToOriginalColumnIndexes[columnIndex];
    if (originalColumnIndex === undefined) return;

    const sorted = sortRows(rows, {
      columnIndex: originalColumnIndex,
      direction: newDirection,
    });
    setSortedRows(sorted);
    setCurrentPage(1);
  };

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Remove the status column from visible rows before processing
  const visiblePaginatedRows =
    productStatusColumnIndex !== undefined
      ? paginatedRows.map((row) =>
          row.filter((_, index) => index !== productStatusColumnIndex),
        )
      : paginatedRows;

  const processedRows = processRows({
    rows: visiblePaginatedRows,
    imageColumnIndex,
    variantColumnIndex,
    titleColumnIndex,
  });

  // Remove the status column from headings and content types
  const visibleHeadings =
    productStatusColumnIndex !== undefined
      ? headings.filter((_, index) => index !== productStatusColumnIndex)
      : headings;

  const visibleColumnContentTypes =
    productStatusColumnIndex !== undefined
      ? columnContentTypes.filter(
          (_, index) => index !== productStatusColumnIndex,
        )
      : columnContentTypes;

  const processedHeadings =
    variantColumnIndex !== undefined
      ? visibleHeadings.filter((_, index) => index !== variantColumnIndex)
      : visibleHeadings;

  const processedColumnContentTypes =
    variantColumnIndex !== undefined
      ? visibleColumnContentTypes.filter(
          (_, index) => index !== variantColumnIndex,
        )
      : visibleColumnContentTypes;

  const displayHeadings = useMemo(() => {
    return processedHeadings.map((heading) => {
      const headingText = heading.toString();
      if (!headingText.trim()) return headingText;

      const helpText = COLUMN_HELP_TEXT[headingText];
      if (!helpText) return headingText;

      return (
        <Tooltip key={headingText} content={helpText} dismissOnMouseOut>
          <span style={headingWrapperStyle}>{headingText}</span>
        </Tooltip>
      );
    });
  }, [processedHeadings]);

  const topContainerStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    marginBottom: "20px",
    width: "100%",
  };

  const searchAndExportContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  };

  function getCellText(cell: any): string {
    if (typeof cell === "string" || typeof cell === "number")
      return cell.toString();
    if (cell == null) return "";
    if (typeof cell === "object") {
      if (cell.props?.children) {
        if (
          typeof cell.props.children === "string" ||
          typeof cell.props.children === "number"
        ) {
          return cell.props.children.toString();
        }
        if (Array.isArray(cell.props.children)) {
          return cell.props.children.map(getCellText).join(" ");
        }
        return getCellText(cell.props.children);
      }
    }
    return "";
  }

  return (
    <CollapsibleCard
      isLoading={isLoading}
      isEmpty={statusFilteredRows.length === 0}
      emptyStateMessage={emptyStateMessage}
      emptyStateDescription={emptyStateDescription}
    >
      {statusFilteredRows.length > 0 && (
        <>
          <div style={topContainerStyle}>
            <div style={searchAndExportContainerStyle}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <TablePageSizeSelector
                  pageSize={pageSize}
                  totalRows={totalRows}
                  onPageSizeChange={handlePageSizeChange}
                />
                <ExportButtons
                  headers={processedHeadings.map((h) => h.toString())}
                  rows={processedRows.map((row) => row.map(getCellText))}
                  fileName={tableName}
                />
                {productStatusColumnIndex !== undefined && (
                  <div style={statusDropdownContainerStyle}>
                    <label
                      htmlFor={`${tableName}-status-filter`}
                      style={statusDropdownLabelStyle}
                    >
                      Status:
                    </label>
                    <select
                      id={`${tableName}-status-filter`}
                      value={selectedProductStatus}
                      onChange={(e) =>
                        handleProductStatusChange(e.target.value)
                      }
                      style={statusDropdownStyle}
                    >
                      {PRODUCT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <SearchSection
                onSearchChange={handleSearchChange}
                initialValue={searchTerm}
              />
            </div>

            {showFilters && (
              <FilterChips
                filterChips={filterChips}
                activeFilters={activeFilters}
                onFilterClick={handleFilterClick}
              />
            )}
          </div>
          {filteredRows.length === 0 ? (
            <NoResultsState searchTerm={searchTerm} />
          ) : (
            <DataTable
              rows={processedRows}
              headings={displayHeadings}
              columnContentTypes={processedColumnContentTypes}
              sortColumnIndex={sortColumnIndex}
              onSort={handleSortByColumn}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalRows={totalRows}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </CollapsibleCard>
  );
}

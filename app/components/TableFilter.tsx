import type { TableData } from "@shopify/polaris";
import { getInventoryCriteria } from "../services/analysis/inventory-categorization.service";
import { parseNumberFromDisplayValue } from "../lib/code-utils";

interface FilterOptions {
  searchTerm: string;
  titleColumnIndex: number;
  variantColumnIndex?: number;
  activeFilters: string[];
  inventoryDaysForStatus?: number;
}

export function filterRows(
  rows: TableData[][],
  options: FilterOptions,
): TableData[][] {
  const { searchTerm, titleColumnIndex, variantColumnIndex, activeFilters } =
    options;
  const criteria = getInventoryCriteria(options.inventoryDaysForStatus);
  let result = rows;

  if (searchTerm) {
    result = result.filter((row) => {
      const productName = String(row[titleColumnIndex]);
      const variantName =
        variantColumnIndex !== undefined ? String(row[variantColumnIndex]) : "";
      const searchString = `${productName} ${variantName}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  }

  if (!activeFilters.includes("all")) {
    result = result.filter((row) => {
      const item = {
        currentInventory: parseNumberFromDisplayValue(row[4]),
        dailyRate: parseNumberFromDisplayValue(row[5]),
      };

      if (
        activeFilters.includes("running-low") &&
        criteria.isRunningLow(item)
      ) {
        return true;
      }
      if (
        activeFilters.includes("out-of-stock") &&
        criteria.isOutOfStock(item)
      ) {
        return true;
      }
      if (
        activeFilters.includes("no-sales") &&
        criteria.isNoSales(item)
      ) {
        return true;
      }
      if (
        activeFilters.includes("overstocked") &&
        criteria.isOverstocked(item)
      ) {
        return true;
      }
      if (
        activeFilters.includes("healthy") &&
        criteria.isHealthy(item)
      ) {
        return true;
      }
      return false;
    });
  }

  return result;
}

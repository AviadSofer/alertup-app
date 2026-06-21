import { MINIMUM_INVENTORY_DAYS } from "../../constants";

export interface InventoryItem {
  currentInventory: number;
  dailyRate: number;
}

export interface CategoryCriteria {
  isRunningLow: (item: InventoryItem) => boolean;
  isOutOfStock: (item: InventoryItem) => boolean;
  isNoSales: (item: InventoryItem) => boolean;
  isOverstocked: (item: InventoryItem) => boolean;
  isHealthy: (item: InventoryItem) => boolean;
}

export function getInventoryCriteria(
  minimumInventoryDays: number = MINIMUM_INVENTORY_DAYS,
): CategoryCriteria {
  const safeDays = Number.isFinite(minimumInventoryDays)
    ? Math.max(1, minimumInventoryDays)
    : MINIMUM_INVENTORY_DAYS;

  return {
    isRunningLow: (item: InventoryItem): boolean => {
      const reorderPoint = item.dailyRate * safeDays;
      return item.currentInventory <= reorderPoint && item.currentInventory > 0;
    },

    isOutOfStock: (item: InventoryItem): boolean => {
      return item.currentInventory === 0;
    },

    isNoSales: (item: InventoryItem): boolean => {
      return item.dailyRate === 0 && item.currentInventory !== 0;
    },

    isOverstocked: (item: InventoryItem): boolean => {
      if (item.dailyRate === 0) return false;
      const reorderPoint = item.dailyRate * safeDays;
      return item.currentInventory > reorderPoint * 1.5;
    },

    isHealthy: (item: InventoryItem): boolean => {
      if (item.dailyRate === 0 || item.currentInventory === 0) return false;
      const reorderPoint = item.dailyRate * safeDays;
      return (
        item.currentInventory > reorderPoint &&
        item.currentInventory <= reorderPoint * 1.5
      );
    },
  };
}

export const inventoryCriteria: CategoryCriteria =
  getInventoryCriteria(MINIMUM_INVENTORY_DAYS);

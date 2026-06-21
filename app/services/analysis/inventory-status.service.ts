import type { ProductInventory } from "./analysis-product-inventory.service";
import { inventoryCriteria } from "./inventory-categorization.service";

export interface InventoryStatus {
  runningLow: {
    count: number;
    percentage: number;
    products: ProductInventory[];
  };
  outOfStock: {
    count: number;
    percentage: number;
    products: ProductInventory[];
  };
  noSales: {
    count: number;
    percentage: number;
    products: ProductInventory[];
  };
  overstocked: {
    count: number;
    percentage: number;
    products: ProductInventory[];
  };
  healthy: {
    count: number;
    percentage: number;
    products: ProductInventory[];
  };
  totalVariants: number;
}

export function analyzeInventoryStatus(
  products: ProductInventory[],
): InventoryStatus {
  const totalVariants = products.length;

  const categorizedProducts = products.reduce(
    (acc, product) => {
      if (inventoryCriteria.isRunningLow(product)) {
        acc.runningLow.push(product);
      } else if (inventoryCriteria.isOutOfStock(product)) {
        acc.outOfStock.push(product);
      } else if (inventoryCriteria.isNoSales(product)) {
        acc.noSales.push(product);
      } else if (inventoryCriteria.isOverstocked(product)) {
        acc.overstocked.push(product);
      } else if (inventoryCriteria.isHealthy(product)) {
        acc.healthy.push(product);
      }
      return acc;
    },
    {
      runningLow: [] as ProductInventory[],
      outOfStock: [] as ProductInventory[],
      noSales: [] as ProductInventory[],
      overstocked: [] as ProductInventory[],
      healthy: [] as ProductInventory[],
    },
  );

  return {
    runningLow: {
      count: categorizedProducts.runningLow.length,
      percentage: (categorizedProducts.runningLow.length / totalVariants) * 100,
      products: categorizedProducts.runningLow,
    },
    outOfStock: {
      count: categorizedProducts.outOfStock.length,
      percentage: (categorizedProducts.outOfStock.length / totalVariants) * 100,
      products: categorizedProducts.outOfStock,
    },
    noSales: {
      count: categorizedProducts.noSales.length,
      percentage: (categorizedProducts.noSales.length / totalVariants) * 100,
      products: categorizedProducts.noSales,
    },
    overstocked: {
      count: categorizedProducts.overstocked.length,
      percentage:
        (categorizedProducts.overstocked.length / totalVariants) * 100,
      products: categorizedProducts.overstocked,
    },
    healthy: {
      count: categorizedProducts.healthy.length,
      percentage: (categorizedProducts.healthy.length / totalVariants) * 100,
      products: categorizedProducts.healthy,
    },
    totalVariants,
  };
}

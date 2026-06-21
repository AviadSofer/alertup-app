import type { ProductInventory } from "./inventory-analysis.server";
import { inventoryCriteria } from "../services/analysis/inventory-categorization.service";

export interface ReorderProduct {
  title: string;
  variantTitle: string | null;
  recommendedReorderQuantity: number;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  noSalesData?: boolean;
  status:
    | "out-of-stock"
    | "running-low"
    | "healthy"
    | "overstocked"
    | "no-sales";
}

export function getReorderList(
  productInventoryAnalysis: ProductInventory[],
): ReorderProduct[] {
  return productInventoryAnalysis
    .filter(
      (product) =>
        product.recommendedReorderQuantity > 0 ||
        product.currentInventory === 0,
    )
    .map((product) => {
      let status: ReorderProduct["status"] = "healthy";

      if (product.currentInventory === 0) {
        status = "out-of-stock";
      } else if (product.dailyRate === 0) {
        status = "no-sales";
      } else if (
        inventoryCriteria.isRunningLow({
          currentInventory: product.currentInventory,
          dailyRate: product.dailyRate,
        })
      ) {
        status = "running-low";
      } else if (
        inventoryCriteria.isOverstocked({
          currentInventory: product.currentInventory,
          dailyRate: product.dailyRate,
        })
      ) {
        status = "overstocked";
      }

      return {
        featuredImage: product.featuredImage,
        title: product.title,
        variantTitle: product.variantTitle,
        recommendedReorderQuantity: product.recommendedReorderQuantity,
        noSalesData: product.currentInventory === 0 && product.dailyRate === 0,
        status,
      };
    })
    .sort((a, b) => {
      const priorityOrder = {
        "out-of-stock": 0,
        "running-low": 1,
        "no-sales": 2,
        healthy: 3,
        overstocked: 4,
      };
      return priorityOrder[a.status] - priorityOrder[b.status];
    });
}

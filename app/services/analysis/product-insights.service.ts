import type { ProductInventory } from "./analysis-product-inventory.service";

export enum InsightType {
  STANDARD_REORDER = "STANDARD_REORDER",
  CRITICAL_STOCKOUT = "CRITICAL_STOCKOUT",
  PLAN_AHEAD = "PLAN_AHEAD",
}

export interface ProductInsight {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string | null;
  insightType: InsightType;
  message?: string;
  daysUntilStockout: number | "∞";
  recommendedReorderQuantity: number;
  currentInventory: number;
  dailyRate: number;
  insightLog?: {
    firstDetectedAt: Date;
    lastDetectedAt: Date;
  } | null;
}

export function generateProductInsights(
  products: ProductInventory[],
): ProductInsight[] {
  const insights: ProductInsight[] = [];

  products.forEach((product) => {
    // Out of Stock Alert
    if (product.currentInventory === 0) {
      insights.push({
        productId: product.id,
        productTitle: product.title,
        variantId: product.variantId,
        variantTitle: product.variantTitle,
        insightType: InsightType.CRITICAL_STOCKOUT,
        daysUntilStockout: 0,
        recommendedReorderQuantity: product.recommendedReorderQuantity,
        currentInventory: product.currentInventory,
        dailyRate: product.dailyRate,
      });
      return;
    }

    // Critical Stockout Alert
    if (
      product.daysUntilStockout !== "∞" &&
      product.daysUntilStockout < 7 &&
      product.recommendedReorderQuantity > 0
    ) {
      insights.push({
        productId: product.id,
        productTitle: product.title,
        variantId: product.variantId,
        variantTitle: product.variantTitle,
        insightType: InsightType.CRITICAL_STOCKOUT,
        daysUntilStockout: product.daysUntilStockout,
        recommendedReorderQuantity: product.recommendedReorderQuantity,
        currentInventory: product.currentInventory,
        dailyRate: product.dailyRate,
      });
    }
    // Plan Ahead Recommendation
    else if (
      product.daysUntilStockout !== "∞" &&
      product.daysUntilStockout >= 7 &&
      product.daysUntilStockout <= 30 &&
      product.recommendedReorderQuantity > 0
    ) {
      insights.push({
        productId: product.id,
        productTitle: product.title,
        variantId: product.variantId,
        variantTitle: product.variantTitle,
        insightType: InsightType.PLAN_AHEAD,
        daysUntilStockout: product.daysUntilStockout,
        recommendedReorderQuantity: product.recommendedReorderQuantity,
        currentInventory: product.currentInventory,
        dailyRate: product.dailyRate,
      });
    }
    // Standard Reorder Recommendation
    else if (product.recommendedReorderQuantity > 0) {
      insights.push({
        productId: product.id,
        productTitle: product.title,
        variantId: product.variantId,
        variantTitle: product.variantTitle,
        insightType: InsightType.STANDARD_REORDER,
        daysUntilStockout: product.daysUntilStockout,
        recommendedReorderQuantity: product.recommendedReorderQuantity,
        currentInventory: product.currentInventory,
        dailyRate: product.dailyRate,
      });
    }
  });

  // Sort insights by priority: Plan Ahead > Critical > Standard
  return insights.sort((a, b) => {
    const priorityOrder = {
      [InsightType.PLAN_AHEAD]: 0,
      [InsightType.CRITICAL_STOCKOUT]: 1,
      [InsightType.STANDARD_REORDER]: 2,
    };
    return priorityOrder[a.insightType] - priorityOrder[b.insightType];
  });
}

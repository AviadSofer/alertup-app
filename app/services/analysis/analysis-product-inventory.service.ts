import type { Order } from "../graphql/get-recent-orders";
import type { Product, ProductStatus } from "../graphql/get-all-products";
import type { InventoryItem } from "../graphql/get-inventory-levels";
import {
  SALES_ANALYSIS_PERIOD_DAYS,
  MINIMUM_INVENTORY_DAYS,
  DAILY_RATE_CAP_MULTIPLIER,
  IS_USE_DAILY_RATE_CAP,
} from "../../constants";
import { Decimal } from "decimal.js";

export interface ProductInventory {
  id: string;
  title: string;
  variantId: string;
  variantTitle: string | null;
  status: ProductStatus;
  totalSalesQuantity: number;
  dailyRate: number;
  daysUntilStockout: number | "∞";
  currentInventory: number;
  recommendedReorderQuantity: number;
  featuredImage?: {
    url: string;
    altText?: string;
  };
}

type InventoryItemMap = Map<string, InventoryItem>;

const formattingVariantSales = (product: Product): ProductInventory[] => {
  return product.variants.edges.map(({ node: variant }) => ({
    id: product.id,
    title: product.title,
    variantId: variant.id,
    variantTitle: variant.title || null,
    status: product.status,
    totalSalesQuantity: 0,
    dailyRate: 0,
    daysUntilStockout: "∞",
    currentInventory: 0,
    recommendedReorderQuantity: 0,
    featuredImage: product.featuredImage,
  }));
};

const calculateVariantSales = (
  orders: Order[],
  initialVariants: Map<string, ProductInventory>,
): {
  updatedVariants: Map<string, ProductInventory>;
  variantSalesData: Map<string, { dailySales: { [date: string]: number } }>;
} => {
  const variantSalesData = new Map();
  const updatedVariants = new Map(initialVariants);

  orders.forEach((order) => {
    const orderDate = order.createdAt.split("T")[0];

    order.lineItems.edges.forEach(({ node: lineItem }) => {
      if (!lineItem.variant) return;

      const variantId = lineItem.variant.id;
      const existingVariant = updatedVariants.get(variantId);

      if (existingVariant) {
        const salesData = variantSalesData.get(variantId) || { dailySales: {} };
        salesData.dailySales[orderDate] =
          (salesData.dailySales[orderDate] || 0) + lineItem.quantity;
        variantSalesData.set(variantId, salesData);

        const newTotal = new Decimal(existingVariant.totalSalesQuantity)
          .plus(lineItem.quantity)
          .toNumber();

        updatedVariants.set(variantId, {
          ...existingVariant,
          totalSalesQuantity: newTotal,
        });
      }
    });
  });

  return { updatedVariants, variantSalesData };
};

const calculateDailyRates = (
  variants: ProductInventory[],
  variantSalesData: Map<string, { dailySales: { [date: string]: number } }>,
  salesAnalysisDays: number = SALES_ANALYSIS_PERIOD_DAYS,
): ProductInventory[] => {
  return variants.map((variant) => {
    const regularDailyRate = new Decimal(variant.totalSalesQuantity)
      .dividedBy(salesAnalysisDays)
      .toNumber();

    let dailyRate = regularDailyRate;

    if (IS_USE_DAILY_RATE_CAP) {
      const maxDailyQuantity = regularDailyRate * DAILY_RATE_CAP_MULTIPLIER;
      let cappedTotalQuantity = 0;

      const salesData = variantSalesData.get(variant.variantId);
      if (salesData) {
        Object.values(salesData.dailySales).forEach((quantity) => {
          cappedTotalQuantity += Math.min(quantity, maxDailyQuantity);
        });
      }

      dailyRate = new Decimal(cappedTotalQuantity)
        .dividedBy(salesAnalysisDays)
        .toNumber();
    }

    return {
      ...variant,
      dailyRate,
    };
  });
};

const createInventoryItemMap = (
  inventoryItems: InventoryItem[],
): InventoryItemMap => {
  return new Map(inventoryItems.map((item) => [item.variant.id, item]));
};

const calculateTotalAvailableInventory = (
  inventoryItem: InventoryItem,
): number => {
  return inventoryItem.inventoryLevels.edges.reduce((sum, { node }) => {
    const availableQuantity =
      node.quantities.find((q) => q.name === "available")?.quantity || 0;
    return sum + availableQuantity;
  }, 0);
};

const calculateVariantWithInventory = (
  variant: ProductInventory,
  inventoryItem: InventoryItem | undefined,
  reorderDays: number = MINIMUM_INVENTORY_DAYS,
): ProductInventory => {
  if (!inventoryItem) return variant;

  const totalAvailable = calculateTotalAvailableInventory(inventoryItem);
  const dailyRate = new Decimal(variant.dailyRate);

  const requiredInventory = new Decimal(dailyRate).times(
    reorderDays,
  );
  const recommendedReorderQuantity = requiredInventory
    .minus(totalAvailable)
    .toNumber();

  return {
    ...variant,
    currentInventory: totalAvailable,
    daysUntilStockout: dailyRate.isZero()
      ? "∞"
      : Math.floor(new Decimal(totalAvailable).dividedBy(dailyRate).toNumber()),
    recommendedReorderQuantity: Math.max(
      0,
      Math.ceil(recommendedReorderQuantity),
    ),
  };
};

export function analyzeProductInventory(
  orders: Order[],
  products: Product[],
  inventoryItems: InventoryItem[],
  reorderDays: number = MINIMUM_INVENTORY_DAYS,
  salesAnalysisDays: number = SALES_ANALYSIS_PERIOD_DAYS,
): ProductInventory[] {
  const initialVariantSalesMap = new Map<string, ProductInventory>();
  products.forEach((product) => {
    formattingVariantSales(product).forEach((variantSale) => {
      initialVariantSalesMap.set(variantSale.variantId, variantSale);
    });
  });

  const { updatedVariants, variantSalesData } = calculateVariantSales(
    orders,
    initialVariantSalesMap,
  );

  const variantsWithDailyRates = calculateDailyRates(
    Array.from(updatedVariants.values()),
    variantSalesData,
    salesAnalysisDays,
  );

  const inventoryItemsByVariantId = createInventoryItemMap(inventoryItems);

  return variantsWithDailyRates.map((variant) =>
    calculateVariantWithInventory(
      variant,
      inventoryItemsByVariantId.get(variant.variantId),
      reorderDays,
    ),
  );
}

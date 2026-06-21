import type { ProductInsight } from "../services/analysis/product-insights.service";
import { generateProductInsights } from "../services/analysis/product-insights.service";
import { getProductInventoryAnalysis } from "./inventory-analysis.server";
import {
  logProductInsightList,
  getShopProductInsightLogs,
} from "../services/db/product-insight-log.service";
import { getHiddenProductsForShop } from "app/services/db/hidden-product.service";
import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";
import prisma from "app/db.server";
import type { ShopifyHttpOptions } from "app/services/shopify/shopify-fetch.service";

export type { ProductInsight };

function filterInsightsByHiddenProducts(
  insights: ProductInsight[],
  hiddenProducts: Array<{ productId: string; variantId: string | null }>,
): ProductInsight[] {
  if (!insights.length || !hiddenProducts.length) {
    return insights;
  }

  const hiddenProductsMap = new Map<string, boolean>();

  hiddenProducts.forEach((item) => {
    const key = `${item.productId}-${item.variantId || ""}`;
    hiddenProductsMap.set(key, true);
  });

  return insights.filter((insight) => {
    const key = `${insight.productId}-${insight.variantId || ""}`;
    return !hiddenProductsMap.has(key);
  });
}

async function fetchProductInsightLogs(
  shopId: string,
  productInsights: ProductInsight[],
): Promise<
  Array<{
    productId: string;
    variantId: string | null;
    firstDetectedAt: Date;
    lastDetectedAt: Date;
  }>
> {
  await logProductInsightList(shopId, productInsights);
  return getShopProductInsightLogs(shopId);
}

function formatProductInsightsWithLogs(
  productInsights: ProductInsight[],
  hiddenProducts: {
    id: string;
    shopId: string;
    productId: string;
    variantId: string | null;
    hiddenAt: Date;
  }[],
  insightLogs?: Array<{
    productId: string;
    variantId: string | null;
    firstDetectedAt: Date;
    lastDetectedAt: Date;
  }>,
): ProductInsight[] {
  const filteredInsights = hiddenProducts.length
    ? filterInsightsByHiddenProducts(productInsights, hiddenProducts)
    : productInsights;

  if (!insightLogs?.length) {
    return filteredInsights;
  }

  return filteredInsights.map((insight) => {
    const matchingLog = insightLogs.find(
      (log) =>
        log.productId === insight.productId &&
        log.variantId === (insight.variantId || null),
    );

    return {
      ...insight,
      insightLog: matchingLog
        ? {
            firstDetectedAt: matchingLog.firstDetectedAt,
            lastDetectedAt: matchingLog.lastDetectedAt,
          }
        : null,
    };
  });
}

export async function getShopProductInsightsWithLogs(
  shopDomain: string,
  admin?: AdminApiContext,
  httpOptions?: ShopifyHttpOptions,
  salesAnalysisDays: number = 30,
): Promise<ProductInsight[]> {
  const [productInventoryAnalysis, hiddenProducts, shop] = await Promise.all([
    getProductInventoryAnalysis(shopDomain, admin, httpOptions, undefined, salesAnalysisDays),
    getHiddenProductsForShop(shopDomain),
    prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
      select: { id: true },
    }),
  ]);

  const productInsights = generateProductInsights(productInventoryAnalysis);
  const insightLogs = await fetchProductInsightLogs(shop!.id, productInsights);
  return formatProductInsightsWithLogs(
    productInsights,
    hiddenProducts,
    insightLogs,
  );
}

import { getRecentOrders } from "../services/graphql/get-recent-orders";
import { getAllProducts } from "../services/graphql/get-all-products";
import { getInventoryLevels } from "../services/graphql/get-inventory-levels";
import type { ProductInventory } from "../services/analysis/analysis-product-inventory.service";
import { analyzeProductInventory } from "../services/analysis/analysis-product-inventory.service";
import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";
import type { ShopifyHttpOptions } from "../services/shopify/shopify-fetch.service";
import type { ProductStatus } from "../services/graphql/get-all-products";
import { MINIMUM_INVENTORY_DAYS } from "../constants";

export type { ProductInventory, ProductStatus };

// In-memory cache for fast navigation (5 minute TTL)
const cache = new Map<string, { data: ProductInventory[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function getReorderDaysFromRequest(request: Request): number {
  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  return daysParam && !isNaN(parseInt(daysParam, 10)) 
    ? parseInt(daysParam, 10) 
    : MINIMUM_INVENTORY_DAYS;
}

export async function getProductInventoryAnalysis(
  shopDomain: string,
  admin?: AdminApiContext,
  httpOptions?: ShopifyHttpOptions,
  reorderDays?: number,
  salesAnalysisDays: number = 30,
): Promise<ProductInventory[]> {
  const cacheKey = `${shopDomain}-${reorderDays || "default"}-${salesAnalysisDays}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (!admin && !httpOptions) {
    throw new Error("You must provide either admin or httpOptions");
  }

  // Run in parallel for speed. The retry logic in shopify-fetch.service.ts
  // handles Shopify API Rate Limiting (Throttled errors) with jittered backoff.
  const [orders, products, inventoryItems] = await Promise.all([
    getRecentOrders(admin, httpOptions, salesAnalysisDays),
    getAllProducts(admin, httpOptions),
    getInventoryLevels(admin, httpOptions),
  ]);

  const analysis = analyzeProductInventory(orders, products, inventoryItems, reorderDays, salesAnalysisDays);
  
  // Save to cache
  cache.set(cacheKey, { data: analysis, timestamp: Date.now() });

  return analysis;
}

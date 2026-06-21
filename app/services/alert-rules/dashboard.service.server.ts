import db from "../../db.server";
import { getProductsInfoByInventoryItemIds } from "../db/inventory-level.service";
import {
  type AlertRuleView,
  getAlertRulesForShop,
  getStoreDefaultThreshold,
  isMissingAlertSchema,
} from "./alert-rule.service.server";
import {
  getAlertLogsForShop,
  getAlertStatsForShop,
} from "./alert-log.service.server";

export interface AlertDashboardSummary {
  activeRulesCount: number;
  productsBelowThresholdCount: number;
  totalInventoryItemsCount: number;
  alertsSentThisWeek: number;
  defaultThreshold: number | null;
  hasRules: boolean;
  rules: AlertRuleView[];
  recentAlerts: Awaited<ReturnType<typeof getAlertLogsForShop>>["logs"];
}

export async function getAlertDashboardSummary(shopId: string) {
  const [rules, defaultThreshold, stats, recentAlertResult] = await Promise.all([
    getAlertRulesForShop(shopId),
    getStoreDefaultThreshold(shopId),
    getAlertStatsForShop(shopId),
    getAlertLogsForShop(shopId, { page: 1, limit: 5 }),
  ]);
  const previewThreshold = defaultThreshold ?? 5;
  const preview = await getLowStockVariantPreview(shopId, previewThreshold);

  return {
    activeRulesCount: rules.filter((rule) => rule.enabled).length,
    productsBelowThresholdCount: preview.belowThreshold,
    totalInventoryItemsCount: preview.totalMatching,
    alertsSentThisWeek: stats.week,
    defaultThreshold,
    hasRules: rules.length > 0,
    rules,
    recentAlerts: recentAlertResult.logs,
  } satisfies AlertDashboardSummary;
}

export interface LowStockPreviewItem {
  id: string;
  productTitle: string;
  variantTitle?: string;
  imageUrl?: string;
  availableQuantity: number;
}

export async function getLowStockVariantPreview(
  shopId: string,
  threshold: number,
) {
  try {
    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: { shopifyDomain: true, accessToken: true },
    });

    if (!shop) throw new Error("Shop not found");

    const inventoryRows = await db.inventoryLevel.groupBy({
      by: ["inventoryItemId"],
      where: { shopId },
      _sum: {
        availableQuantity: true,
      },
    });

    let belowThreshold = 0;
    const distribution: Record<string, number> = {};
    const belowItems: { id: string; qty: number }[] = [];

    for (const row of inventoryRows) {
      const qty = row._sum.availableQuantity ?? 0;
      if (qty <= 50) {
        distribution[qty] = (distribution[qty] || 0) + 1;
        belowItems.push({ id: row.inventoryItemId, qty });
      }
      if (qty <= threshold) {
        belowThreshold++;
      }
    }

    let topItems: LowStockPreviewItem[] = [];
    if (belowItems.length > 0) {
      belowItems.sort((a, b) => a.qty - b.qty);
      const top10 = belowItems.slice(0, 10);

      const productInfos = await getProductsInfoByInventoryItemIds(
        shop.shopifyDomain,
        shop.accessToken,
        top10.map((i) => i.id),
      );

      topItems = top10.map((item) => {
        const info = productInfos.find(
          (p) => p.inventoryItemId === item.id,
        );
        return {
          id: item.id,
          productTitle: info?.productTitle ?? "Unknown Product",
          variantTitle: info?.variantTitle,
          imageUrl: info?.imageUrl,
          availableQuantity: item.qty,
        };
      });
    }

    return {
      totalMatching: inventoryRows.length,
      belowThreshold,
      topItems,
      distribution,
    };
  } catch (error) {
    if (isMissingAlertSchema(error)) {
      return {
        totalMatching: 0,
        belowThreshold: 0,
        topItems: [],
        distribution: {},
      };
    }
    throw error;
  }
}

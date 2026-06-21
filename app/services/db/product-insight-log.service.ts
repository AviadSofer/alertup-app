import prisma from "../../db.server";
import type { ProductInsight } from "../analysis/product-insights.service";
import { InsightType } from "../analysis/product-insights.service";

export async function logProductInsight(
  shopId: string,
  insight: ProductInsight,
): Promise<void> {
  // Only log CRITICAL_STOCKOUT insights where inventory is 0
  if (
    insight.insightType !== InsightType.CRITICAL_STOCKOUT ||
    insight.currentInventory !== 0
  ) {
    return;
  }

  try {
    // Check if we already have a log for this product
    const existingLog = await prisma.productInsightLog.findFirst({
      where: {
        shopId,
        productId: insight.productId,
        variantId: insight.variantId,
      },
    });

    if (existingLog) {
      // Update the last detected date
      await prisma.productInsightLog.update({
        where: { id: existingLog.id },
        data: {
          lastDetectedAt: new Date(),
          currentInventory: insight.currentInventory,
          dailyRate: insight.dailyRate,
        },
      });
    } else {
      // Create a new insight log
      await prisma.productInsightLog.create({
        data: {
          shopId,
          productId: insight.productId,
          productTitle: insight.productTitle,
          variantId: insight.variantId,
          variantTitle: insight.variantTitle,
          currentInventory: insight.currentInventory,
          dailyRate: insight.dailyRate,
        },
      });
    }
  } catch (error) {
    console.error("Failed to log product insight:", error);
  }
}

export async function logProductInsightList(
  shopId: string,
  productInsights: ProductInsight[],
) {
  await Promise.all(
    productInsights
      .filter(
        (insight) =>
          insight.insightType === InsightType.CRITICAL_STOCKOUT &&
          insight.currentInventory === 0,
      )
      .map(async (insight) => {
        await logProductInsight(shopId, insight);
      }),
  );
}

export async function getProductInsightLog(
  shopId: string,
  productId: string,
  variantId?: string,
) {
  try {
    const varId = variantId || null;

    return await prisma.productInsightLog.findFirst({
      where: {
        shopId,
        productId,
        variantId: varId,
      },
    });
  } catch (error) {
    console.error("Failed to get product insight log:", error);
    return null;
  }
}

export async function getShopProductInsightLogs(shopId: string) {
  try {
    return await prisma.productInsightLog.findMany({
      where: { shopId },
    });
  } catch (error) {
    console.error("Failed to get shop product insight logs:", error);
    return [];
  }
}

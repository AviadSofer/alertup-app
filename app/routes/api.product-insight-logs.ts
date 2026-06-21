import { type LoaderFunctionArgs } from 'react-router';
import { authenticate } from "../shopify.server";
import { getShopProductInsightLogs } from "app/services/db/product-insight-log.service";
import prisma from "app/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("[api.product-insight-logs] GET request received");

  try {
    const { session } = await authenticate.admin(request);
    console.log(`[api.product-insight-logs] Shop: ${session.shop}`);

    const shopDomain = session.shop;
    const shop = await prisma.shop.findUnique({
      where: { shopifyDomain: shopDomain },
      select: { id: true },
    });

    if (!shop) {
      console.warn(`[api.product-insight-logs] Shop not found: ${shopDomain}`);
      return { insightLogs: [] };
    }

    const insightLogs = await getShopProductInsightLogs(shop.id);
    console.log(`[api.product-insight-logs] Returned ${insightLogs.length} logs`);

    return { insightLogs };
  } catch (error) {
    console.error("[api.product-insight-logs] Error:", error);
    throw error;
  }
}

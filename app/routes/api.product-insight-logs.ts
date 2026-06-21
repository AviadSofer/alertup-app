import { type LoaderFunctionArgs } from 'react-router';
import { authenticate } from "../shopify.server";
import { getShopProductInsightLogs } from "app/services/db/product-insight-log.service";
import prisma from "app/db.server";
import { isPivotPlaceholderEnabled } from "../lib/feature-toggles";

export async function loader({ request }: LoaderFunctionArgs) {
  if (isPivotPlaceholderEnabled()) {
    return new Response(JSON.stringify({ error: "Pivot enabled, old insights disabled." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { session } = await authenticate.admin(request);

  // Get shop ID from the session
  const shopDomain = session.shop;
  const shop = await prisma.shop.findUnique({
    where: { shopifyDomain: shopDomain },
    select: { id: true },
  });

  if (!shop) {
    return { insightLogs: [] };
  }

  // Get all product insight logs for the shop
  const insightLogs = await getShopProductInsightLogs(shop.id);

  return { insightLogs };
}

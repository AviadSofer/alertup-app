import { type LoaderFunctionArgs } from 'react-router';
import { authenticate } from "../shopify.server";
import { getShopProductInsightsWithLogs } from "../models/product-insights.server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("[api.product-insights] GET request received");

  try {
    const { admin, session } = await authenticate.admin(request);
    console.log(`[api.product-insights] Shop: ${session.shop}`);

    const url = new URL(request.url);
    const historyDaysParam = url.searchParams.get("historyDays");
    const historyDays = historyDaysParam && !isNaN(parseInt(historyDaysParam, 10))
      ? parseInt(historyDaysParam, 10)
      : 30;

    console.log(`[api.product-insights] Fetching insights for ${historyDays} days`);
    const productInsights = await getShopProductInsightsWithLogs(
      session.shop,
      admin,
      undefined,
      historyDays,
    );

    console.log(`[api.product-insights] Returned ${productInsights.length} insights`);
    return { productInsights };
  } catch (error) {
    console.error("[api.product-insights] Error:", error);
    throw error;
  }
}

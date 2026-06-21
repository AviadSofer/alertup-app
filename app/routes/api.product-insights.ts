import { type LoaderFunctionArgs } from 'react-router';
import { authenticate } from "../shopify.server";
import { getShopProductInsightsWithLogs } from "../models/product-insights.server";
import { isPivotPlaceholderEnabled } from "../lib/feature-toggles";

export async function loader({ request }: LoaderFunctionArgs) {
  if (isPivotPlaceholderEnabled()) {
    return new Response(JSON.stringify({ error: "Pivot enabled, old insights disabled." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const historyDaysParam = url.searchParams.get("historyDays");
  const historyDays = historyDaysParam && !isNaN(parseInt(historyDaysParam, 10)) 
    ? parseInt(historyDaysParam, 10) 
    : 30;

  const productInsights = await getShopProductInsightsWithLogs(
    session.shop,
    admin,
    undefined,
    historyDays,
  );

  return { productInsights };
}

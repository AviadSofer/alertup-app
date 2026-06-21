import { type ActionFunctionArgs } from 'react-router';
import prisma from "../db.server";

export async function loader({ request }: ActionFunctionArgs) {
  console.log("[api.email-product-insights] GET request received");

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[api.email-product-insights] Unauthorized request");
    return { error: "Unauthorized" };
  }

  try {
    const result = await dispatchEmailQueue(request.url);
    console.log("[api.email-product-insights] Dispatch result:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("[api.email-product-insights] Error:", error);
    return Response.json({ error: "Failed to dispatch" }, { status: 500 });
  }
}

async function dispatchEmailQueue(requestUrl: string) {
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      shopifyDomain: true,
    },
    where: {
      receiveProductInsightsEmails: true,
    },
  });

  if (shops.length === 0) {
    console.log("[api.email-product-insights] No active shops to process.");
    return { success: true, queuedShops: 0 };
  }

  const shopIds = shops.map((s) => s.id);
  console.log(`[api.email-product-insights] Queuing ${shopIds.length} shops for insights processing`);

  const url = new URL(requestUrl);
  const workerUrl = `${url.origin}/api/process-single-shop`;

  fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({ shopIds }),
  }).catch((e) => console.error("[api.email-product-insights] Failed to trigger worker:", e));

  return { success: true, queuedShops: shopIds.length };
}

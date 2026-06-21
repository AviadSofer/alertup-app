import { type ActionFunctionArgs } from 'react-router';
import prisma from "../db.server";
import { isPivotPlaceholderEnabled } from "../lib/feature-toggles";

export async function loader({ request }: ActionFunctionArgs) {
  if (isPivotPlaceholderEnabled()) {
    return new Response("Pivot enabled, old insights disabled.", { status: 200 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return { error: "Unauthorized" };
  }
  return dispatchEmailQueue(request.url);
}

// This is the CRON Trigger endpoint.
// It fetches all active shops and starts the self-pinging background queue to process emails.
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
    console.log("[Email Dispatcher] No active shops to process.");
    return { success: true, queuedShops: 0 };
  }

  const shopIds = shops.map((s) => s.id);
  console.log(`[Email Dispatcher] Queuing ${shopIds.length} shops for insights processing`);

  // We extract the domain from the current request URL to construct the worker URL
  const url = new URL(requestUrl);
  const workerUrl = `${url.origin}/api/process-single-shop`;

  // Start the chain reaction by triggering the first worker in the background
  fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({ shopIds }),
  }).catch((e) => console.error("[Email Dispatcher] Failed to trigger worker:", e));

  // Return immediately to Vercel so the CRON job never times out.
  return { success: true, queuedShops: shopIds.length };
}

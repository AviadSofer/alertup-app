import { type ActionFunctionArgs } from 'react-router';
import prisma from "../db.server";
import { getShopProductInsightsWithLogs } from "app/models/product-insights.server";
import { sendProductInsightsEmail } from "app/services/resend/resend.service";
import { isPivotPlaceholderEnabled } from "../lib/feature-toggles";

// This is an internal worker route designed to bypass Vercel's 10-second timeout.
// It processes one shop and then immediately fires a fire-and-forget HTTP request 
// to itself to process the next shop in line, resetting the Vercel execution clock.

export async function action({ request }: ActionFunctionArgs) {
  if (isPivotPlaceholderEnabled()) {
    return new Response("Pivot enabled, old insights disabled.", { status: 200 });
  }

  // Ensure this is an internal authenticated call
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await request.json();
    const shopIds = data.shopIds as string[];

    if (!shopIds || shopIds.length === 0) {
      console.log("[Email Queue] Queue empty, processing complete.");
      return new Response("Queue finished", { status: 200 });
    }

    // Dequeue the first shop
    const currentShopId = shopIds.shift()!;
    console.log(`[Email Queue] Processing shop ID: ${currentShopId}. Remaining in queue: ${shopIds.length}`);

    // Fire & Forget: Trigger the next worker in the background BEFORE we start heavy processing
    // This ensures that even if this specific shop crashes or times out, the chain continues.
    if (shopIds.length > 0) {
      const url = new URL(request.url);
      fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ shopIds }),
      }).catch((e) => console.error("[Email Queue] Failed to trigger next worker:", e));
    }

    // Process the current shop
    const shop = await prisma.shop.findUnique({
      where: { id: currentShopId },
      select: {
        id: true,
        shopifyDomain: true,
        accessToken: true,
        name: true,
        email: true,
        receiveProductInsightsEmails: true,
      },
    });

    if (!shop) {
      console.error(`[Email Queue] Shop ID ${currentShopId} not found in DB`);
      return new Response("Shop not found", { status: 404 });
    }

    if (shop.receiveProductInsightsEmails === false) {
      console.log(`[Email Queue] Skipping ${shop.shopifyDomain}: user opted out`);
      return new Response("Opted out", { status: 200 });
    }

    console.log(`[Email Queue] Fetching data for ${shop.shopifyDomain}...`);
    const insights = await getShopProductInsightsWithLogs(
      shop.shopifyDomain,
      undefined,
      { shopifyDomain: shop.shopifyDomain, accessToken: shop.accessToken },
    );

    console.log(`[Email Queue] Sending email to ${shop.email}...`);
    await sendProductInsightsEmail({
      to: [{ email: shop.email, name: shop.name }],
      shopDomain: shop.shopifyDomain,
      insights,
    });

    console.log(`[Email Queue] Success for ${shop.shopifyDomain}`);
    return new Response("Success", { status: 200 });

  } catch (error) {
    console.error("[Email Queue] Worker crashed:", error);
    return new Response("Worker Error", { status: 500 });
  }
}

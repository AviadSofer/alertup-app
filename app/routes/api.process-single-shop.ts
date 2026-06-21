import { type ActionFunctionArgs } from 'react-router';
import prisma from "../db.server";
import { getShopProductInsightsWithLogs } from "app/models/product-insights.server";
import { sendProductInsightsEmail } from "app/services/resend/resend.service";

export async function action({ request }: ActionFunctionArgs) {
  console.log("[api.process-single-shop] POST request received");

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[api.process-single-shop] Unauthorized request");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await request.json();
    const shopIds = data.shopIds as string[];

    if (!shopIds || shopIds.length === 0) {
      console.log("[api.process-single-shop] Queue empty, processing complete.");
      return new Response("Queue finished", { status: 200 });
    }

    const currentShopId = shopIds.shift()!;
    console.log(`[api.process-single-shop] Processing shop ID: ${currentShopId}. Remaining in queue: ${shopIds.length}`);

    if (shopIds.length > 0) {
      const url = new URL(request.url);
      fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ shopIds }),
      }).catch((e) => console.error("[api.process-single-shop] Failed to trigger next worker:", e));
    }

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
      console.error(`[api.process-single-shop] Shop ID ${currentShopId} not found in DB`);
      return new Response("Shop not found", { status: 404 });
    }

    if (shop.receiveProductInsightsEmails === false) {
      console.log(`[api.process-single-shop] Skipping ${shop.shopifyDomain}: user opted out`);
      return new Response("Opted out", { status: 200 });
    }

    console.log(`[api.process-single-shop] Fetching data for ${shop.shopifyDomain}...`);
    const insights = await getShopProductInsightsWithLogs(
      shop.shopifyDomain,
      undefined,
      { shopifyDomain: shop.shopifyDomain, accessToken: shop.accessToken },
    );

    console.log(`[api.process-single-shop] Sending email to ${shop.email}...`);
    await sendProductInsightsEmail({
      to: [{ email: shop.email, name: shop.name }],
      shopDomain: shop.shopifyDomain,
      insights,
    });

    console.log(`[api.process-single-shop] Success for ${shop.shopifyDomain}`);
    return new Response("Success", { status: 200 });

  } catch (error) {
    console.error("[api.process-single-shop] Worker crashed:", error);
    return new Response("Worker Error", { status: 500 });
  }
}

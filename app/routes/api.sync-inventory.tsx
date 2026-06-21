import type { ActionFunctionArgs } from "react-router";
import { upsertInventoryLevels } from "app/services/db/inventory-level.service";
import { authenticate } from "app/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("[api.sync-inventory] POST request received");

  try {
    const { session, admin } = await authenticate.admin(request);
    console.log(`[api.sync-inventory] Authenticated shop: ${session.shop}`);

    const result = await upsertInventoryLevels(session.shop, admin);
    console.log(`[api.sync-inventory] Updated inventory levels for ${result.length} products`);

    return Response.json({
      message: `Updated inventory levels for ${result.length} products`,
    });
  } catch (error) {
    console.error("[api.sync-inventory] Error:", error);
    return Response.json({ error: "Failed to sync inventory" }, { status: 500 });
  }
};

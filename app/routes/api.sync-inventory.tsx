import type { ActionFunctionArgs } from "react-router";
import { upsertInventoryLevels } from "app/services/db/inventory-level.service";
import { authenticate } from "app/shopify.server";
import { log } from "app/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  log({ message: "[api.sync-inventory] POST request received" });

  try {
    const { session, admin } = await authenticate.admin(request);
    log({ message: `[api.sync-inventory] Authenticated shop: ${session.shop}` });

    const result = await upsertInventoryLevels(session.shop, admin);
    log({ message: `[api.sync-inventory] Updated inventory levels for ${result.length} products` });

    return Response.json({
      message: `Updated inventory levels for ${result.length} products`,
    });
  } catch (error) {
    log({ level: "error", message: "[api.sync-inventory] Error:", error });
    return Response.json({ error: "Failed to sync inventory" }, { status: 500 });
  }
};

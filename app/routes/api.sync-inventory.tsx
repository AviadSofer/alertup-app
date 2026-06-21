import type { ActionFunctionArgs } from "react-router";
import { upsertInventoryLevels } from "app/services/db/inventory-level.service";
import { authenticate } from "app/shopify.server";
import { isPivotPlaceholderEnabled } from "../lib/feature-toggles";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (isPivotPlaceholderEnabled()) {
    return new Response(JSON.stringify({ error: "Pivot enabled, sync disabled." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { session, admin } = await authenticate.admin(request);

  const result = await upsertInventoryLevels(session.shop, admin);

  return {
    message: `Updated inventory levels for ${result.length} products`,
  };
};

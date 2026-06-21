import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  getInventoryLevelByItemAndLocation,
  getProductInfoByInventoryItemId,
  updateInventoryLevelQuantity,
} from "../services/db/inventory-level.service";
import { getShopByDomain } from "../services/db/shop.service";
import db from "../db.server";
import { findMatchingRules } from "../services/alert-rules/alert-matcher.service.server";
import { sendAlertDigestEmail } from "../services/resend/resend.service";
import { log } from "app/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);

  log({ message: `Received inventory update webhook from ${shop}` });

  const {
    inventory_item_id: inventoryItemId,
    location_id: locationId,
    available: newAvailableQuantity,
  } = payload;

  if (typeof newAvailableQuantity !== "number" || isNaN(newAvailableQuantity)) {
    log({ level: "warn", message: `[Webhook] Invalid or missing available quantity in payload for item ${inventoryItemId}: ${newAvailableQuantity}` });
    return new Response("Invalid available quantity", { status: 200 });
  }

  // Add Shopify GID prefixes to match the format in the database
  const formattedInventoryItemId = `gid://shopify/InventoryItem/${inventoryItemId}`;
  const formattedLocationId = `gid://shopify/Location/${locationId}`;

  log({ message: `Inventory update for item ${formattedInventoryItemId} at location ${formattedLocationId}. New available quantity: ${newAvailableQuantity}` });

  // Run DB lookups in parallel to save ~1-2s of sequential roundtrips
  const [previousInventoryData, shopData] = await Promise.all([
    getInventoryLevelByItemAndLocation(
      formattedInventoryItemId,
      formattedLocationId,
    ),
    getShopByDomain(shop),
  ]);

  if (!previousInventoryData) {
    log({ message: `No previous data found for inventory item ${formattedInventoryItemId} at location ${formattedLocationId}` });
    return new Response("No previous data found", { status: 200 });
  }

  if (!shopData) {
    log({ message: `Shop data not found for ${shop}` });
    return new Response("Shop data not found", { status: 200 });
  }

  // Targeted single-item GraphQL query (~200ms vs 10-30s for full pagination)
  const productInfo = await getProductInfoByInventoryItemId(
    shop,
    shopData.accessToken,
    formattedInventoryItemId,
  );

  if (productInfo) {
    log({ message: `Found product info: ${productInfo.productTitle}` });
  } else {
    log({ message: `Could not find product info for inventory item ${formattedInventoryItemId}` });
  }

  const skipEmailAlerts = shopData.receiveStockAlertEmails === false;
  const currentStock = Number(newAvailableQuantity);
  const previousStock = previousInventoryData.availableQuantity;

  const matchingRules = productInfo
    ? await findMatchingRules({
        shopId: shopData.id,
        inventoryItemId: formattedInventoryItemId,
        locationId: formattedLocationId,
        productId: productInfo.productId,
        variantId: productInfo.variantId,
        collectionIds: productInfo.collectionIds,
        vendor: productInfo.vendor,
        currentStock,
        previousStock,
      })
    : [];

  const instantMatches = matchingRules.filter(
    (match) => match.rule.deliveryMode === "instant",
  );

  if (!skipEmailAlerts && productInfo) {
    for (const match of instantMatches) {
      const recipients = match.rule.recipients.map((recipient) => ({
        email: recipient.email,
      }));

      if (recipients.length === 0) {
        log({ message: `Skipping rule ${match.rule.id}; no recipients configured` });
        continue;
      }

      try {
        log({ message: `Attempting to send alert email for rule ${match.rule.id} to ${recipients.length} recipients` });
        await sendAlertDigestEmail({
          to: recipients,
          shopDomain: shop,
          ruleName: match.rule.name,
          items: [
            {
              productTitle: productInfo.productTitle,
              variantTitle: productInfo.variantTitle,
              sku: productInfo.sku,
              currentStock,
              threshold: match.rule.threshold,
              reorderQty: match.reorderQty ?? undefined,
            },
          ],
        });

        log({ message: `Email sent successfully for rule ${match.rule.id}. Updating logs and stats.` });
        await db.$transaction([
          db.alertLog.create({
            data: {
              alertRuleId: match.rule.id,
              shopId: shopData.id,
              productTitle: productInfo.productTitle,
              variantTitle: productInfo.variantTitle ?? null,
              sku: productInfo.sku ?? null,
              currentStock,
              threshold: match.rule.threshold,
              reorderQty: match.reorderQty ?? null,
              recipientEmails: recipients.map((recipient) => recipient.email).join(","),
              deliveryMode: "instant",
            },
          }),
          db.alertRule.update({
            where: { id: match.rule.id },
            data: {
              lastTriggeredAt: new Date(),
              triggerCount: { increment: 1 },
            },
          }),
        ]);
        log({ message: `Successfully processed rule ${match.rule.id} for ${shop}` });
      } catch (error) {
        log({ level: "error", message: `Failed to process rule ${match.rule.id} for ${shop}:`, error });
      }
    }
  }

  await updateInventoryLevelQuantity(previousInventoryData.id, currentStock);

  const result = getWebhookResult({
    matchedInstantRuleCount: instantMatches.length,
    productInfoFound: Boolean(productInfo),
    skipEmailAlerts,
  });

  log({ message: `Inventory update processing result: ${result}` });

  return new Response(result, { status: 200 });
};

function getWebhookResult({
  matchedInstantRuleCount,
  productInfoFound,
  skipEmailAlerts,
}: {
  matchedInstantRuleCount: number;
  productInfoFound: boolean;
  skipEmailAlerts: boolean;
}) {
  if (!productInfoFound) {
    return "Inventory updated; product info unavailable";
  }

  if (skipEmailAlerts && matchedInstantRuleCount > 0) {
    return "Inventory updated; alert emails disabled";
  }

  if (matchedInstantRuleCount > 0) {
    return `Inventory updated; sent ${matchedInstantRuleCount} alert rule notification${
      matchedInstantRuleCount === 1 ? "" : "s"
    }`;
  }

  return "Inventory updated; no instant alert rules matched";
}

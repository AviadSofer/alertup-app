import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { log } from "app/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  log({ message: `Received ${topic} webhook for ${shop}` });

  // Parse the webhook payload
  const { shop_id, shop_domain } = payload;

  log({ message: `Shop redaction request for shop ${shop_domain} (ID: ${shop_id})` });

  try {
    // This webhook is sent 48 hours after app uninstallation
    // You should delete ALL data associated with this shop
    // Complete the action within 30 days of receiving this request

    // Delete all shop-related data from your app's database
    // Note: Adapt these queries to match your actual database schema

    // Delete sessions (may already be done in app/uninstalled webhook)
    await db.session.deleteMany({
      where: { shop: shop_domain },
    });

    // Delete shop record (may already be done in app/uninstalled webhook)
    try {
      await db.shop.delete({
        where: { shopifyDomain: shop_domain },
      });
    } catch (error) {
      // Shop might already be deleted in app/uninstalled webhook
      log({ message: "Shop record already deleted or not found" });
    }



    // Log the shop redaction for compliance tracking
    log({
      message: "Shop data redaction completed:",
      data: {
        shop_id,
        shop_domain,
        timestamp: new Date().toISOString(),
      }
    });


  } catch (error) {
    log({ level: "error", message: "Error processing shop redaction request:", error });
    // Still return success to acknowledge receipt of the webhook
    // You should retry the deletion process later
  }

  return new Response();
};

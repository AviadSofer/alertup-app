import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Parse the webhook payload
  const { shop_id, shop_domain } = payload;

  console.log(
    `Shop redaction request for shop ${shop_domain} (ID: ${shop_id})`,
  );

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
      console.log("Shop record already deleted or not found");
    }

    // Delete any other shop-related data your app stores:

    // Example: Delete all customers for this shop
    // await db.customer.deleteMany({
    //   where: { shopDomain: shop_domain }
    // });

    // Example: Delete all order data for this shop
    // await db.orderData.deleteMany({
    //   where: { shopDomain: shop_domain }
    // });

    // Example: Delete analytics data for this shop
    // await db.analytics.deleteMany({
    //   where: { shopDomain: shop_domain }
    // });

    // Example: Delete any app-specific settings or configurations
    // await db.settings.deleteMany({
    //   where: { shopDomain: shop_domain }
    // });

    // Example: Delete any cached or processed data
    // await db.processedData.deleteMany({
    //   where: { shopDomain: shop_domain }
    // });

    // Log the shop redaction for compliance tracking
    console.log("Shop data redaction completed:", {
      shop_id,
      shop_domain,
      timestamp: new Date().toISOString(),
    });

    // TODO: Store this redaction record for compliance tracking
    // You should keep a minimal record that redaction was completed
  } catch (error) {
    console.error("Error processing shop redaction request:", error);
    // Still return success to acknowledge receipt of the webhook
    // You should retry the deletion process later
  }

  return new Response();
};

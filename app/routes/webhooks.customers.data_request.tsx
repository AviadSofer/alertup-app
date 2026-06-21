import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { log } from "app/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  log({ message: `Received ${topic} webhook for ${shop}` });

  // Parse the webhook payload
  const { shop_id, shop_domain, orders_requested, customer, data_request } =
    payload;

  log({ message: `Data request ${data_request.id} for customer ${customer.id} (${customer.email})` });
  log({ message: `Orders requested: ${orders_requested}` });

  try {
    log({
      message: "Customer data request processed: No PII stored, no action required.",
      data: {
        shop_id,
        shop_domain,
        customer_id: customer.id,
        data_request_id: data_request.id,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    log({ level: "error", message: "Error processing customer data request:", error });
    // Still return success to acknowledge receipt of the webhook
  }

  return new Response();
};

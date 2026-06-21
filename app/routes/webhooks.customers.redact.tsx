import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { log } from "app/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  log({ message: `Received ${topic} webhook for ${shop}` });

  // Parse the webhook payload
  const { shop_id, shop_domain, customer, orders_to_redact } = payload;

  log({ message: `Customer redaction request for customer ${customer.id} (${customer.email})` });
  log({ message: `Orders to redact: ${orders_to_redact}` });

  try {
    log({
      message: "Customer data redaction completed: No PII stored, no action required.",
      data: {
        shop_id,
        shop_domain,
        customer_id: customer.id,
        customer_email: customer.email,
        orders_redacted: orders_to_redact,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    log({ level: "error", message: "Error processing customer redaction request:", error });
    // Still return success to acknowledge receipt of the webhook
    // You should retry the deletion process later
  }

  return new Response();
};

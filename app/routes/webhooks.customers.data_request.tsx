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
    // TODO: Implement data collection logic based on your app's data storage
    // You should:
    // 1. Collect all stored data for the customer (customer.id, customer.email)
    // 2. Collect data for the requested orders (orders_requested array)
    // 3. Send the collected data directly to the store owner
    // 4. The data should be provided within 30 days of this request

    // Log the data request for compliance tracking
    log({
      message: "Customer data request processed:",
      data: {
        shop_id,
        shop_domain,
        customer_id: customer.id,
        data_request_id: data_request.id,
        timestamp: new Date().toISOString(),
      }
    });

    // TODO: Store this request in your database for compliance tracking
    // TODO: Send the collected data to the store owner
    // You might want to email the data or provide it through another secure method
  } catch (error) {
    log({ level: "error", message: "Error processing customer data request:", error });
    // Still return success to acknowledge receipt of the webhook
  }

  return new Response();
};

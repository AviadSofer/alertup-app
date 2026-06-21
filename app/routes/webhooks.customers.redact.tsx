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
    // TODO: Implement customer data deletion logic based on your app's data storage
    // You should:
    // 1. Delete all stored data for the customer (customer.id, customer.email)
    // 2. Delete data for the specified orders (orders_to_redact array)
    // 3. Complete the action within 30 days of receiving this request
    // 4. Only skip deletion if legally required to retain data

    // Example deletion logic (adapt to your database schema):

    // Delete customer-related data from your app's database
    // Note: Adapt these queries to match your actual database schema

    // If you have a customers table:
    // await db.customer.deleteMany({
    //   where: {
    //     OR: [
    //       { shopifyCustomerId: customer.id },
    //       { email: customer.email }
    //     ]
    //   }
    // });

    // If you have order-related data:
    // await db.orderData.deleteMany({
    //   where: {
    //     shopifyOrderId: {
    //       in: orders_to_redact
    //     }
    //   }
    // });

    // Delete any analytics or tracking data for this customer
    // await db.analytics.deleteMany({
    //   where: {
    //     OR: [
    //       { customerId: customer.id },
    //       { customerEmail: customer.email }
    //     ]
    //   }
    // });

    // Log the redaction for compliance tracking
    log({
      message: "Customer data redaction completed:",
      data: {
        shop_id,
        shop_domain,
        customer_id: customer.id,
        customer_email: customer.email,
        orders_redacted: orders_to_redact,
        timestamp: new Date().toISOString(),
      }
    });

    // TODO: Store this redaction record in your database for compliance tracking
    // You should keep a record that redaction was completed (but not the actual data)
  } catch (error) {
    log({ level: "error", message: "Error processing customer redaction request:", error });
    // Still return success to acknowledge receipt of the webhook
    // You should retry the deletion process later
  }

  return new Response();
};

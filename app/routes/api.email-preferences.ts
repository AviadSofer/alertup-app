import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { authenticate } from "../shopify.server";
import {
  getEmailPreferences,
  updateEmailPreferences,
} from "app/services/db/shop.service";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("[api.email-preferences] GET request received");

  try {
    const { session } = await authenticate.admin(request);
    console.log(`[api.email-preferences] Shop: ${session.shop}`);
    const preferences = await getEmailPreferences(session.shop);
    console.log(`[api.email-preferences] Preferences loaded`);
    return preferences;
  } catch (error) {
    console.error("[api.email-preferences] Error loading preferences:", error);
    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("[api.email-preferences] POST request received");

  try {
    const { session } = await authenticate.admin(request);
    console.log(`[api.email-preferences] Updating for shop: ${session.shop}`);

    const formData = await request.formData();

    const receiveProductInsightsEmailsValue = formData.get(
      "receiveProductInsightsEmails",
    );
    const receiveStockAlertEmailsValue = formData.get("receiveStockAlertEmails");

    const updateData: {
      receiveProductInsightsEmails?: boolean;
      receiveStockAlertEmails?: boolean;
    } = {};

    if (receiveProductInsightsEmailsValue !== null) {
      updateData.receiveProductInsightsEmails =
        receiveProductInsightsEmailsValue === "true";
    }

    if (receiveStockAlertEmailsValue !== null) {
      updateData.receiveStockAlertEmails =
        receiveStockAlertEmailsValue === "true";
    }

    const updatedPreferences = await updateEmailPreferences(
      session.shop,
      updateData,
    );

    console.log(`[api.email-preferences] Updated successfully`);
    return { success: true, preferences: updatedPreferences };
  } catch (error) {
    console.error("[api.email-preferences] Error updating:", error);
    throw error;
  }
}

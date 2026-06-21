import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { authenticate } from "../shopify.server";
import {
  getEmailPreferences,
  updateEmailPreferences,
} from "app/services/db/shop.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const preferences = await getEmailPreferences(session.shop);
  return preferences;
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

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

  return { success: true, preferences: updatedPreferences };
}

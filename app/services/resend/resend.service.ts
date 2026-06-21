import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/components";

import { RESEND_API_KEY } from "app/constants";
import {
  formatDate,
  generateAppLink,
  generateUnsubscribeLink,
} from "app/lib/code-utils";

import type { ProductInsight } from "../analysis/product-insights.service";
import WelcomeEmail from "./emails/WelcomeEmail";
import StockAlertEmail from "./emails/StockAlertEmail";
import DailyInsightsEmail from "./emails/DailyInsightsEmail";
import AlertDigestEmail from "./emails/AlertDigestEmail";
import AlertRuleCreatedEmail from "./emails/AlertRuleCreatedEmail";

const resend = new Resend(RESEND_API_KEY);

export interface AlertDigestItem {
  productTitle: string;
  variantTitle?: string | null;
  sku?: string | null;
  currentStock: number;
  threshold: number;
  reorderQty?: number | null;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  text?: string;
}) {
  const recipients = to.map((recipient) =>
    recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email,
  );

  const { data, error } = await resend.emails.send({
    from: "Stockup <noreply@mail.stokow.com>",
    to: recipients,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Resend API Error:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function sendProductInsightsEmail({
  to,
  shopDomain,
  insights,
}: {
  to: { email: string; name?: string }[];
  shopDomain: string;
  insights: ProductInsight[];
}) {
  // Format insights for the template
  const formattedInsights: Record<string, any> =
    Array.isArray(insights) && insights.length > 0
      ? insights.reduce((acc: Record<string, any>, insight, index) => {
          const stockDays =
            insight.currentInventory && insight.dailyRate
              ? Math.round(insight.currentInventory / insight.dailyRate)
              : 0;

          acc[index.toString()] = {
            product: `${insight.productTitle}${
              insight.variantTitle && insight.variantTitle !== "Default Title"
                ? ` - ${insight.variantTitle}`
                : ""
            }`,
            days_left: stockDays.toString(),
            current_stock: insight.currentInventory?.toString() || "0",
            reorder_amount: Math.max(
              0,
              Math.round(insight.recommendedReorderQuantity || 0),
            ).toString(),
          };
          return acc;
        }, {})
      : {};

  // Add size property
  formattedInsights.size = Array.isArray(insights)
    ? insights.length.toString()
    : "0";

  // Format the insights data for display
  const formattedEmailInsights: Record<string, any> = {};
  if (Array.isArray(insights)) {
    insights.forEach((insight, index) => {
      let color = "";
      let message = "";

      if (insight.insightType === "CRITICAL_STOCKOUT") {
        color = "#dc2626"; // Professional Red
        if (insight.currentInventory === 0) {
          message = `${insight.productTitle}${
            insight.variantTitle && insight.variantTitle !== "Default Title"
              ? ` - ${insight.variantTitle}`
              : ""
          } is out of stock`;
        } else {
          message = `${insight.productTitle}${
            insight.variantTitle && insight.variantTitle !== "Default Title"
              ? ` - ${insight.variantTitle}`
              : ""
          } will run out in ${insight.daysUntilStockout} days`;
        }
      } else if (insight.insightType === "PLAN_AHEAD") {
        color = "#d97706"; // Professional Amber
        message = `${insight.productTitle}${
          insight.variantTitle && insight.variantTitle !== "Default Title"
            ? ` - ${insight.variantTitle}`
            : ""
        } will run out in ${insight.daysUntilStockout} days`;
      } else {
        color = "#0ea5e9"; // Professional Blue
        message = `Recommend ordering ${
          insight.recommendedReorderQuantity
        } more units of ${insight.productTitle}${
          insight.variantTitle && insight.variantTitle !== "Default Title"
            ? ` - ${insight.variantTitle}`
            : ""
        }`;
      }

      formattedEmailInsights[index.toString()] = {
        color,
        message,
      };
    });
    formattedEmailInsights.size = insights.length.toString();
  } else {
    formattedEmailInsights["0"] = {
      color: "#9ca3af", // Gray
      message: "No new insights today",
    };
    formattedEmailInsights.size = "0";
  }

  // Render React Email template to HTML
  const html = await render(
    React.createElement(DailyInsightsEmail, {
      userName: shopDomain,
      dashboardLink: generateAppLink(shopDomain),
      unsubscribeLink: generateUnsubscribeLink(shopDomain),
      insights: formattedEmailInsights,
      reorderSummary: formattedInsights,
    })
  );

  return sendEmail({
    to,
    subject: `Product Insights for ${shopDomain} (${formatDate(new Date())})`,
    html,
  });
}

export async function sendStockAlertEmail({
  to,
  shopDomain,
  productName,
  headline,
  stockStatusDescription,
  currentStock,
  daysLeft,
  recommendation,
  productDashboardLink,
  backgroundColor,
}: {
  to: { email: string; name?: string }[];
  shopDomain: string;
  productName: string;
  headline: string;
  stockStatusDescription: string;
  currentStock: string | number;
  daysLeft: string | number;
  recommendation: string;
  productDashboardLink: string;
  backgroundColor?: string;
}) {
  // Format current stock as string with "OR" logic for display
  const formattedCurrentStock =
    typeof currentStock === "number" ? currentStock.toString() : currentStock;

  // Format days left as string with "OR" logic for display
  const formattedDaysLeft =
    typeof daysLeft === "number" ? daysLeft.toString() : daysLeft;

  // Render React Email template to HTML
  const html = await render(
    React.createElement(StockAlertEmail, {
      headline,
      productName,
      stockStatusDescription,
      currentStock: formattedCurrentStock,
      daysLeft: formattedDaysLeft,
      recommendation,
      productDashboardLink,
      unsubscribeLink: generateUnsubscribeLink(shopDomain),
      backgroundColor: backgroundColor || "#fff4e0",
    })
  );

  return sendEmail({
    to,
    subject: `Stock Alert: ${productName} - ${shopDomain}`,
    html,
  });
}

export async function sendWelcomeEmail({
  to,
  shopDomain,
}: {
  to: { email: string; name?: string }[];
  shopDomain: string;
}) {
  const userName = to[0]?.name || shopDomain;
  
  // Render React Email template to HTML
  const html = await render(
    React.createElement(WelcomeEmail, {
      userName,
      dashboardLink: generateAppLink(shopDomain),
      unsubscribeLink: generateUnsubscribeLink(shopDomain),
    })
  );

  return sendEmail({
    to,
    subject: `Welcome to Stockup - ${shopDomain}`,
    html,
  });
}

export async function sendAlertDigestEmail({
  to,
  shopDomain,
  ruleName,
  items,
}: {
  to: { email: string; name?: string }[];
  shopDomain: string;
  ruleName: string;
  items: AlertDigestItem[];
}) {
  const html = await render(
    React.createElement(AlertDigestEmail, {
      shopDomain,
      ruleName,
      dashboardLink: generateAppLink(shopDomain),
      unsubscribeLink: generateUnsubscribeLink(shopDomain),
      items,
    }),
  );

  return sendEmail({
    to,
    subject: `Low Stock Alert: ${ruleName} - ${shopDomain}`,
    html,
  });
}

export async function sendAlertRuleCreatedEmail({
  to,
  shopDomain,
  threshold,
}: {
  to: { email: string; name?: string }[];
  shopDomain: string;
  threshold: number;
}) {
  const html = await render(
    React.createElement(AlertRuleCreatedEmail, {
      shopDomain,
      threshold,
      dashboardLink: generateAppLink(shopDomain),
    }),
  );

  return sendEmail({
    to,
    subject: `Low-stock alerts are active - ${shopDomain}`,
    html,
  });
}

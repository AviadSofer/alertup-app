import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/components";

import { RESEND_API_KEY } from "app/constants";
import {
  formatDate,
  generateAppLink,
  generateUnsubscribeLink,
} from "app/lib/code-utils";

import WelcomeEmail from "./emails/WelcomeEmail";
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

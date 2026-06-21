import type { Session } from "@shopify/shopify-api";
import db from "../../db.server";
import type { ShopInfo } from "../graphql/get-shop-info";

export async function upsertShop(session: Session, shopInfo: ShopInfo) {
  return db.shop.upsert({
    where: {
      shopifyDomain: session.shop,
    },
    update: {
      accessToken: session.accessToken || "",
      updatedAt: new Date(),
      email: shopInfo.email,
      contactEmail: shopInfo.contactEmail,
      plan: shopInfo.plan.displayName,
    },
    create: {
      shopifyDomain: session.shop,
      accessToken: session.accessToken || "",
      onboardingDone: false,
      name: shopInfo.name,
      email: shopInfo.email,
      contactEmail: shopInfo.contactEmail,
      plan: shopInfo.plan.displayName,
    },
  });
}

export async function getShopByDomain(domain: string) {
  return await db.shop.findUnique({
    where: {
      shopifyDomain: domain,
    },
  });
}

export async function setOnboardingDone(shopifyDomain: string) {
  return await db.shop.update({
    where: { shopifyDomain },
    data: { onboardingDone: true },
  });
}

export async function getEmailPreferences(shopifyDomain: string) {
  const shop = await db.shop.findUnique({
    where: { shopifyDomain },
    select: {
      receiveProductInsightsEmails: true,
      receiveStockAlertEmails: true,
    },
  });

  return (
    shop || {
      receiveProductInsightsEmails: true,
      receiveStockAlertEmails: true,
    }
  );
}

export async function updateEmailPreferences(
  shopifyDomain: string,
  {
    receiveProductInsightsEmails,
    receiveStockAlertEmails,
  }: {
    receiveProductInsightsEmails?: boolean;
    receiveStockAlertEmails?: boolean;
  },
) {
  const data: Record<string, any> = {};

  if (receiveProductInsightsEmails !== undefined) {
    data.receiveProductInsightsEmails = receiveProductInsightsEmails;
  }

  if (receiveStockAlertEmails !== undefined) {
    data.receiveStockAlertEmails = receiveStockAlertEmails;
  }

  if (Object.keys(data).length === 0) {
    return null;
  }

  return await db.shop.update({
    where: { shopifyDomain },
    data,
  });
}

import { authenticate } from "app/shopify.server";
import { getShopByDomain } from "../db/shop.service";

export async function validate(request: Request) {
  const { session, redirect, billing } = await authenticate.admin(request);

  const [shop, { hasActivePayment }] = await Promise.all([
    getShopByDomain(session.shop),
    billing.check(),
  ]);

  if (!shop || !hasActivePayment || !shop.onboardingDone) {
    return { redirect: redirect("/onboarding") };
  }

  return {
    session,
    shop,
  };
}

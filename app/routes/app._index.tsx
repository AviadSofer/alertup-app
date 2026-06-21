import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useRouteError } from 'react-router';
import { Banner, Layout, Page } from "@shopify/polaris";

import { authenticate } from "app/shopify.server";
import {
  DEFAULT_RULE_NAME,
  getAlertRulesForShop,
  getShopIdByDomain,
  setStoreDefaultThreshold,
} from "app/services/alert-rules/alert-rule.service.server";
import { getAlertDashboardSummary } from "app/services/alert-rules/dashboard.service.server";
import type { AlertDashboardSummary } from "app/services/alert-rules/dashboard.service.server";
import { getShopByDomain } from "app/services/db/shop.service";
import { sendAlertRuleCreatedEmail } from "app/services/resend/resend.service";
import { Dashboard } from "../components/Dashboard";
import { log } from "app/lib/logger.server";

interface LoaderData {
  summary: AlertDashboardSummary;
  shopEmail: string | null;
}

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  log({ message: "[app._index] Loading dashboard" });

  const { session } = await authenticate.admin(request);
  log({ message: `[app._index] Authenticated shop: ${session.shop}` });

  const [shopId, shop] = await Promise.all([
    getShopIdByDomain(session.shop),
    getShopByDomain(session.shop),
  ]);
  const shopEmail = shop?.contactEmail || shop?.email || null;

  if (!shopId) {
    log({ message: "[app._index] No shopId found, returning empty summary" });
    return {
      shopEmail,
      summary: {
        activeRulesCount: 0,
        productsBelowThresholdCount: 0,
        totalInventoryItemsCount: 0,
        alertsSentThisWeek: 0,
        defaultThreshold: null,
        hasRules: false,
        rules: [],
        recentAlerts: [],
      },
    };
  }

  const summary = await getAlertDashboardSummary(shopId);
  log({ message: `[app._index] Dashboard loaded: ${summary.activeRulesCount} active rules` });

  return {
    summary,
    shopEmail,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  log({ message: "[app._index] Action received" });

  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  log({ message: `[app._index] Action intent: ${intent}, shop: ${session.shop}` });

  if (intent !== "activate-default-alert") {
    return { error: "Unknown action." };
  }

  const shop = await getShopByDomain(session.shop);
  const shopId = shop?.id ?? null;

  if (!shopId) {
    return {
      error: "Shop setup is still in progress. Please refresh and try again.",
    };
  }

  const thresholdValue = String(formData.get("defaultThreshold") ?? "");
  const threshold = Number(thresholdValue);

  if (!Number.isInteger(threshold) || threshold < 0) {
    return { error: "Threshold must be a whole number at or above 0." };
  }

  try {
    await setStoreDefaultThreshold(shopId, threshold);
    log({ message: `[app._index] Default threshold set to ${threshold}` });

    const recipientEmail = (shop?.contactEmail || shop?.email || "").trim();

    if (recipientEmail) {
      try {
        await sendAlertRuleCreatedEmail({
          to: [{ email: recipientEmail }],
          shopDomain: session.shop,
          threshold,
        });
        log({ message: `[app._index] Alert rule confirmation email sent to ${recipientEmail}` });
      } catch (emailError) {
        log({ level: "error", message: "[app._index] Alert rule confirmation email failed:", error: emailError });
      }
    }

    const rules = await getAlertRulesForShop(shopId);
    const rule =
      rules.find(
        (candidate) =>
          candidate.scopeType === "all" && candidate.name === DEFAULT_RULE_NAME,
      ) ?? rules.find((candidate) => candidate.scopeType === "all");

    return { success: true, rule };
  } catch (error) {
    log({ level: "error", message: "[app._index] Default alert activation failed:", error });
    return { error: "Low-stock alerts could not be activated yet." };
  }
};

export default function Index() {
  const data = useLoaderData<typeof loader>() as LoaderData;

  return <Dashboard summary={data.summary} shopEmail={data.shopEmail} />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("[app._index] Dashboard Route Error:", error);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Banner title="Error loading dashboard data" tone="critical">
            <p>Please refresh the page or try again later.</p>
          </Banner>
          <Link to="/app/alerts">Go to alert rules</Link>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

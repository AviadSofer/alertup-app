import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useRouteError } from 'react-router';
import { Banner, Layout, Page } from "@shopify/polaris";

import { authenticate } from "app/shopify.server";
import { isPivotPlaceholderEnabled } from "app/lib/feature-toggles";
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
import { LowStockActivation } from "../components/LowStockActivation";
import { PivotDashboard } from "../components/PivotDashboard";

import type { InventoryStatus } from "../models/inventory-status.server";
import { getInventoryStatus } from "../models/inventory-status.server";
import { getProductInventoryAnalysis } from "../models/inventory-analysis.server";
import { ClassicHomePage } from "../components/ClassicHomePage";

type LoaderData =
  | {
      mode: "pivot";
      summary: AlertDashboardSummary;
      shopEmail: string | null;
    }
  | { mode: "classic"; inventoryStatus: InventoryStatus };

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  if (isPivotPlaceholderEnabled()) {
    const { session } = await authenticate.admin(request);
    const [shopId, shop] = await Promise.all([
      getShopIdByDomain(session.shop),
      getShopByDomain(session.shop),
    ]);
    const shopEmail = shop?.contactEmail || shop?.email || null;

    if (!shopId) {
      return {
        mode: "pivot",
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

    return {
      mode: "pivot",
      summary,
      shopEmail,
    };
  }

  const { admin, session } = await authenticate.admin(request);

  const productInventoryAnalysis = await getProductInventoryAnalysis(
    session.shop,
    admin,
  );

  const activeProducts = productInventoryAnalysis.filter(
    (product) => product.status === "ACTIVE",
  );

  return {
    mode: "classic",
    inventoryStatus: getInventoryStatus(activeProducts),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

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

    const recipientEmail = (shop?.contactEmail || shop?.email || "").trim();

    if (recipientEmail) {
      try {
        await sendAlertRuleCreatedEmail({
          to: [{ email: recipientEmail }],
          shopDomain: session.shop,
          threshold,
        });
      } catch (emailError) {
        console.error("Alert rule confirmation email failed:", emailError);
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
    console.error("Default alert activation failed:", error);
    return { error: "Low-stock alerts could not be activated yet." };
  }
};

export default function Index() {
  const data = useLoaderData<typeof loader>() as LoaderData;

  if (data.mode === "classic") {
    return <ClassicHomePage inventoryStatus={data.inventoryStatus} />;
  }

  return <PivotDashboard summary={data.summary} shopEmail={data.shopEmail} />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Dashboard Route Error:", error);

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

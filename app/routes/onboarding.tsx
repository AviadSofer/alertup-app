import { useState } from "react";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  ProgressBar,
  Box,
  AppProvider as PolarisAppProvider,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { ActionButtons } from "app/components/ActionButtons";
import { OnboardingPricing } from "app/components/onboarding/OnboardingPricing";
import { OnboardingInventoryScan } from "app/components/onboarding/OnboardingInventoryScan";
import { OnboardingFirstAlertSetup } from "app/components/onboarding/OnboardingFirstAlertSetup";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { authenticate } from "app/shopify.server";
import {
  getShopByDomain,
  setOnboardingDone,
} from "app/services/db/shop.service";
import { useLoaderData } from "react-router";
import {
  STEP_2_captureOnboardingStarted,
  STEP_3_capturePaymentInitiated,
  STEP_4_capturePaymentCompleted,
  STEP_5_captureTrialConverted,
} from "../services/flow-events/onboarding-events.service";
import { PRICING_PLANS } from "app/constants";
import { upsertInventoryLevels } from "app/services/db/inventory-level.service";
import { generatePricingLink } from "app/lib/code-utils";
import { sendWelcomeEmail } from "app/services/resend/resend.service";
import { getLowStockVariantPreview } from "app/services/alert-rules/dashboard.service.server";
import { createAlertRule } from "app/services/alert-rules/alert-rule.service.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, redirect, admin, billing } =
    await authenticate.admin(request);
  const [shop, { hasActivePayment }] = await Promise.all([
    getShopByDomain(session.shop),
    billing.check(),
  ]);

  // Onboarding completed
  if (shop && hasActivePayment) {
    await Promise.all([
      setOnboardingDone(session.shop),
      STEP_4_capturePaymentCompleted({ distinctId: session.shop }),
      STEP_5_captureTrialConverted({
        distinctId: session.shop,
        trialDuration: PRICING_PLANS.FREE_TRIAL.DURATION,
      }),
      upsertInventoryLevels(session.shop, admin),
      sendWelcomeEmail({
        to: [{ email: shop.email }],
        shopDomain: session.shop,
      }),
    ]);
    return redirect("/");
  }

  await STEP_2_captureOnboardingStarted({ distinctId: session.shop });

  const initialPreview = shop
    ? await getLowStockVariantPreview(shop.id, 5)
    : { totalMatching: 0, belowThreshold: 0 };

  const pricingPageUrl = generatePricingLink(session.shop);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    initialPreview,
    shopEmail: shop?.email ?? null,
    pricingPageUrl,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_alert") {
    const payload = formData.get("rulePayload");
    if (typeof payload === "string") {
      const parsed = JSON.parse(payload);
      const shop = await getShopByDomain(session.shop);
      if (shop) {
        await createAlertRule(shop.id, {
          name: parsed.name,
          enabled: parsed.enabled,
          scopeType: parsed.scopeType as any,
          scopeValue: parsed.scopeValue,
          scopeLabel: parsed.scopeLabel,
          threshold: parsed.threshold,
          maxStockLevel: parsed.maxStockLevel,
          locationId: parsed.locationId,
          locationName: parsed.locationName,
          deliveryMode: parsed.deliveryMode as any,
          schedule: parsed.schedule,
          scheduleDayOfWeek: parsed.scheduleDayOfWeek,
          recipients: parsed.recipients.map((r: any) => r.email),
        });
      }
    }
    return { ok: true };
  }

  return { ok: true };
};

export default function Onboarding() {
  const { apiKey, initialPreview, shopEmail, pricingPageUrl } = useLoaderData<typeof loader>();

  const [step, setStep] = useState(0);
  const [currentPreview, setCurrentPreview] = useState(initialPreview);
  const [selectedThreshold, setSelectedThreshold] = useState(5);
  const [skippedRule, setSkippedRule] = useState(false);

  const handleUpgrade = () => {
    if (pricingPageUrl) {
      window.open(pricingPageUrl, "_top");
    }
  };

  const steps = [
    {
      component: (
        <OnboardingInventoryScan
          initialPreview={currentPreview}
          initialThreshold={selectedThreshold}
          onNext={(preview, threshold) => {
            setCurrentPreview(preview);
            setSelectedThreshold(threshold);
            setStep(1);
          }}
        />
      ),
      label: "Scan",
    },
    {
      component: (
        <OnboardingFirstAlertSetup
          shopEmail={shopEmail}
          initialPreview={currentPreview}
          selectedThreshold={selectedThreshold}
          onNext={() => {
            setSkippedRule(false);
            setStep(2);
          }}
          onSkip={() => {
            setSkippedRule(true);
            setStep(2);
          }}
          onBack={() => setStep(0)}
        />
      ),
      label: "Alert Setup",
    },
    {
      component: (
        <OnboardingPricing
          onBack={() => setStep(1)}
          onNext={handleUpgrade}
          alertSummary={
            skippedRule
              ? undefined
              : {
                  threshold: selectedThreshold,
                  email: shopEmail ?? null,
                  productsCount: currentPreview.totalMatching,
                }
          }
        />
      ),
      label: "Pricing",
    },
  ];

  return (
    <PolarisAppProvider i18n={polarisTranslations}>
      <AppProvider embedded apiKey={apiKey}>
        <TitleBar title="Stockup">
          <ActionButtons showSettings={false} />
        </TitleBar>
        <Page>
          <div
            style={{
              height: "calc(100vh - 64px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box paddingBlockStart="400" paddingBlockEnd="400">
              <ProgressBar progress={((step + 1) / steps.length) * 100} />
            </Box>
            <div
              style={{
                flex: 1,
                background: "var(--p-color-bg-surface)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    width: "100%",
                    maxWidth: 960,
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {steps[step].component}
                </div>
              </div>
            </div>
          </div>
        </Page>
      </AppProvider>
    </PolarisAppProvider>
  );
}

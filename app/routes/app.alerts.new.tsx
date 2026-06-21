import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigate } from 'react-router';
import { Layout, Page } from "@shopify/polaris";
import { useEffect } from "react";

import {
  parseAlertRuleFormData,
  validateAlertRuleInput,
} from "app/components/AlertRuleForm";
import { AlertRuleWizard } from "app/components/AlertRuleWizard";
import { authenticate } from "app/shopify.server";
import { getShopIdByDomain, getStoreDefaultThreshold, createAlertRule } from "app/services/alert-rules/alert-rule.service.server";
import { getShopLocations } from "app/services/locations.service.server";
import { getProductVendors } from "app/services/graphql/get-product-vendors";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = await getShopIdByDomain(session.shop);
  const [locations, defaultThreshold, vendors] = await Promise.all([
    getShopLocations(admin),
    shopId ? getStoreDefaultThreshold(shopId) : null,
    getProductVendors(admin),
  ]);
  return { locations, defaultThreshold, vendors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = await getShopIdByDomain(session.shop);

  if (!shopId) {
    return { error: "Shop setup is still in progress. Please refresh and try again." };
  }

  const input = parseAlertRuleFormData(await request.formData());
  const validationError = validateAlertRuleInput(input);

  if (validationError) {
    return { error: validationError };
  }

  try {
    await createAlertRule(shopId, input);
    return { success: true };
  } catch (error) {
    console.error("Create alert rule failed:", error);
    return { error: "The rule could not be created yet." };
  }
};

export default function NewAlertRulePage() {
  const { locations, defaultThreshold, vendors } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      navigate("/app/alerts");
    }
  }, [actionData, navigate]);

  return (
    <Page
      title="Create alert rule"
      backAction={{ content: "Alert Rules", onAction: () => navigate("/app/alerts") }}
    >
      <Layout>
        <Layout.Section>
          <AlertRuleWizard
            locations={locations}
            vendors={vendors}
            defaultThreshold={defaultThreshold}
            error={actionData && "error" in actionData ? actionData.error : undefined}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

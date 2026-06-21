import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigate } from 'react-router';
import { Banner, Layout, Page } from "@shopify/polaris";
import { useEffect } from "react";

import {
  AlertRuleForm,
  parseAlertRuleFormData,
  validateAlertRuleInput,
} from "app/components/AlertRuleForm";
import { authenticate } from "app/shopify.server";
import {
  getAlertRuleById,
  updateAlertRule,
} from "app/services/alert-rules/alert-rule.service.server";
import { getShopLocations } from "app/services/locations.service.server";
import { getProductVendors } from "app/services/graphql/get-product-vendors";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const [locations, rule, vendors] = await Promise.all([
    getShopLocations(admin),
    params.id ? getAlertRuleById(params.id) : null,
    getProductVendors(admin)
  ]);

  return { rule, locations, vendors };
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const ruleId = params.id;

  if (!ruleId) {
    return { error: "Missing alert rule ID." };
  }

  const input = parseAlertRuleFormData(await request.formData());
  const validationError = validateAlertRuleInput(input);

  if (validationError) {
    return { error: validationError };
  }

  try {
    const rule = await updateAlertRule(ruleId, input);
    return { success: true, rule };
  } catch (error) {
    console.error("Update alert rule failed:", error);
    return { error: "The rule could not be updated yet." };
  }
};

export default function EditAlertRulePage() {
  const { rule, locations, vendors } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      navigate("/app/alerts");
    }
  }, [actionData, navigate]);

  return (
    <Page
      title="Edit alert rule"
      backAction={{ content: "Alert Rules", onAction: () => navigate("/app/alerts") }}
    >
      <Layout>
        <Layout.Section>
          {rule ? (
            <AlertRuleForm
              rule={rule}
              locations={locations}
              vendors={vendors}
              error={
                actionData && "error" in actionData ? actionData.error : undefined
              }
            />
          ) : (
            <Banner title="Alert rule not found" tone="warning">
              <p>This rule may have already been deleted.</p>
            </Banner>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

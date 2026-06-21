import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigate, useRevalidator, useFetcher } from 'react-router';
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  EmptySearchResult,
  IndexTable,
  InlineStack,
  Layout,
  Modal,
  Page,
  Text,
  useIndexResourceState,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons";

import { ToggleSwitch } from "../components/ToggleSwitch";
import { AlertRuleDetailModal } from "../components/AlertRuleDetailModal";
import { SetDefaultThresholdModal } from "../components/SetDefaultThresholdModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import type { AlertRuleView } from "../services/alert-rules/alert-rule.service.server";
import styles from "../components/AlertRules.module.css";

import { authenticate } from "app/shopify.server";
import {
  deleteAlertRule,
  getAlertRulesForShop,
  getShopIdByDomain,
  getStoreDefaultThreshold,
  setStoreDefaultThreshold,
  toggleAlertRule,
  bulkToggleAlertRules,
  bulkDeleteAlertRules,
} from "app/services/alert-rules/alert-rule.service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = await getShopIdByDomain(session.shop);

  if (!shopId) {
    return { rules: [], defaultThreshold: null };
  }

  const [rules, defaultThreshold] = await Promise.all([
    getAlertRulesForShop(shopId),
    getStoreDefaultThreshold(shopId),
  ]);

  return { rules, defaultThreshold };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = await getShopIdByDomain(session.shop);

  if (!shopId) {
    return { error: "Shop setup is still in progress. Please refresh and try again." };
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  try {
    if (intent === "toggle") {
      const ruleId = String(formData.get("ruleId") ?? "");
      const enabled = String(formData.get("enabled") ?? "") === "true";
      await toggleAlertRule(ruleId, enabled);
      return { success: true };
    }

    if (intent === "delete") {
      const ruleId = String(formData.get("ruleId") ?? "");
      await deleteAlertRule(ruleId);
      return { success: true };
    }

    if (intent === "bulk-toggle") {
      const ruleIdsStr = String(formData.get("ruleIds") ?? "[]");
      const ruleIds = JSON.parse(ruleIdsStr) as string[];
      const enabled = String(formData.get("enabled") ?? "") === "true";
      await bulkToggleAlertRules(ruleIds, enabled);
      return { success: true };
    }

    if (intent === "bulk-delete") {
      const ruleIdsStr = String(formData.get("ruleIds") ?? "[]");
      const ruleIds = JSON.parse(ruleIdsStr) as string[];
      await bulkDeleteAlertRules(ruleIds);
      return { success: true };
    }

    if (intent === "set-default-threshold") {
      const thresholdValue = String(formData.get("defaultThreshold") ?? "");
      const threshold = thresholdValue === "" ? null : Number(thresholdValue);

      if (threshold !== null && (!Number.isInteger(threshold) || threshold < 0)) {
        return { error: "Threshold must be a whole number at or above 0." };
      }

      await setStoreDefaultThreshold(shopId, threshold);
      return { success: true };
    }

    return { error: "Unknown action." };
  } catch (error) {
    console.error("Alert rules action failed:", error);
    return { error: "This alert action could not be saved yet." };
  }
};

export default function AlertRulesPage() {
  const { rules, defaultThreshold } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const deleteFetcher = useFetcher();
  const toggleFetcher = useFetcher();
  
  const isDeleting = deleteFetcher.state !== "idle";
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AlertRuleView | null>(null);
  const [deleteRule, setDeleteRule] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [didDelete, setDidDelete] = useState(false);

  useEffect(() => {
    if (didDelete && deleteFetcher.state === "idle" && deleteFetcher.data && (deleteFetcher.data as any).success) {
      setDidDelete(false);
      setDeleteRule(null);
    }
  }, [deleteFetcher.state, deleteFetcher.data, didDelete]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const bulkDeleteFetcher = useFetcher();
  const bulkToggleFetcher = useFetcher();
  const isBulkDeleting = bulkDeleteFetcher.state !== "idle";
  const isBulkToggling = bulkToggleFetcher.state !== "idle";
  const [didBulkDelete, setDidBulkDelete] = useState(false);
  const [didBulkToggle, setDidBulkToggle] = useState(false);

  const revalidator = useRevalidator();
  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(rules as any);

  useEffect(() => {
    if (
      didBulkDelete &&
      bulkDeleteFetcher.state === "idle" &&
      bulkDeleteFetcher.data &&
      (bulkDeleteFetcher.data as any).success
    ) {
      setDidBulkDelete(false);
      clearSelection();
      setBulkDeleteOpen(false);
    }
  }, [bulkDeleteFetcher.state, bulkDeleteFetcher.data, didBulkDelete, clearSelection]);

  useEffect(() => {
    if (
      didBulkToggle &&
      bulkToggleFetcher.state === "idle" &&
      bulkToggleFetcher.data &&
      (bulkToggleFetcher.data as any).success
    ) {
      setDidBulkToggle(false);
      clearSelection();
    }
  }, [bulkToggleFetcher.state, bulkToggleFetcher.data, didBulkToggle, clearSelection]);

  const handleBulkToggle = (enabled: boolean) => {
    setDidBulkToggle(true);
    bulkToggleFetcher.submit(
      {
        intent: "bulk-toggle",
        ruleIds: JSON.stringify(selectedResources),
        enabled: String(enabled),
      },
      { method: "post" },
    );
  };

  const handleBulkDelete = () => {
    setDidBulkDelete(true);
    bulkDeleteFetcher.submit(
      {
        intent: "bulk-delete",
        ruleIds: JSON.stringify(selectedResources),
      },
      { method: "post" },
    );
  };

  const promotedBulkActions = [
    {
      content: "Enable",
      loading: isBulkToggling && bulkToggleFetcher.formData?.get("enabled") === "true",
      disabled: isBulkToggling || isBulkDeleting,
      onAction: () => handleBulkToggle(true),
    },
    {
      content: "Disable",
      loading: isBulkToggling && bulkToggleFetcher.formData?.get("enabled") === "false",
      disabled: isBulkToggling || isBulkDeleting,
      onAction: () => handleBulkToggle(false),
    },
  ];

  const bulkActions = [
    {
      content: "Delete rules",
      disabled: isBulkToggling || isBulkDeleting,
      onAction: () => setBulkDeleteOpen(true),
    },
  ];

  const handleRuleUpdated = () => {
    revalidator.revalidate();
  };

  const emptyStateMarkup = (
    <EmptySearchResult
      title="No alert rules yet"
      description="Create your first rule to start monitoring inventory."
      withIllustration
    />
  );

  return (
    <Page
      title="Alert Rules"
      primaryAction={{ content: "Create Rule", onAction: () => navigate("/app/alerts/new") }}
      secondaryActions={[
        {
          content: "Set Default Threshold",
          onAction: () => setThresholdOpen(true),
        },
      ]}
    >
      <Layout>
        {actionData && "error" in actionData ? (
          <Layout.Section>
            <Banner title="Alert rule action failed" tone="critical">
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        ) : null}

        <Layout.Section>
          <div className={styles.tableContainer}>
            {(isBulkToggling || isBulkDeleting) && (
              <div className={styles.loadingOverlay}>
                <LoadingSpinner text={isBulkDeleting ? "Deleting alert rules..." : "Updating alert rules..."} />
              </div>
            )}
            <Card padding="0">
              <IndexTable
              resourceName={{ singular: "alert rule", plural: "alert rules" }}
              itemCount={rules.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              promotedBulkActions={promotedBulkActions}
              bulkActions={bulkActions}
              headings={[
                { title: "Name" },
                { title: "Scope" },
                { title: "Threshold" },
                { title: "Max stock" },
                { title: "Schedule" },
                { title: "Status" },
                { title: "Last triggered" },
                { title: "Actions" },
              ]}
              emptyState={emptyStateMarkup}
            >
              {rules.map((rule, index) => (
                <IndexTable.Row
                  id={rule.id}
                  key={rule.id}
                  selected={selectedResources.includes(rule.id)}
                  position={index}
                  onClick={() => setSelectedRule(rule)}
                >
                  <IndexTable.Cell>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {rule.name}
                      </Text>
                      <Text as="span" tone="subdued">
                        {rule.recipientCount} recipient
                        {rule.recipientCount === 1 ? "" : "s"}
                      </Text>
                    </BlockStack>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge>{formatScope(rule.scopeType, rule.scopeLabel)}</Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{rule.threshold}</IndexTable.Cell>
                  <IndexTable.Cell>{rule.maxStockLevel ?? "-"}</IndexTable.Cell>
                  <IndexTable.Cell>{formatSchedule(rule)}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <ToggleSwitch
                      checked={
                        toggleFetcher.formData?.get("ruleId") === rule.id
                          ? toggleFetcher.formData.get("enabled") === "true"
                          : rule.enabled
                      }
                      disabled={toggleFetcher.state !== "idle" && toggleFetcher.formData?.get("ruleId") === rule.id}
                      loading={toggleFetcher.state !== "idle" && toggleFetcher.formData?.get("ruleId") === rule.id}
                      onChange={() =>
                        toggleFetcher.submit(
                          {
                            intent: "toggle",
                            ruleId: rule.id,
                            enabled: String(!rule.enabled),
                          },
                          { method: "post" },
                        )
                      }
                    />
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {rule.lastTriggeredAt
                      ? new Date(rule.lastTriggeredAt).toLocaleDateString()
                      : "Never"}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <div onClick={(e) => e.stopPropagation()} role="presentation">
                      <InlineStack gap="100" wrap={false}>
                        <Button
                          variant="plain"
                          icon={EditIcon}
                          accessibilityLabel="Edit"
                          onClick={() => setSelectedRule(rule)}
                        />
                        <Button
                          variant="plain"
                          tone="critical"
                          icon={DeleteIcon}
                          accessibilityLabel="Delete"
                          onClick={() => setDeleteRule({ id: rule.id, name: rule.name })}
                        />
                      </InlineStack>
                    </div>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
          </div>
        </Layout.Section>
      </Layout>

      <SetDefaultThresholdModal
        open={thresholdOpen}
        onClose={() => setThresholdOpen(false)}
        defaultThreshold={defaultThreshold}
      />

      <Modal
        open={deleteRule !== null}
        onClose={() => setDeleteRule(null)}
        title="Delete alert rule"
        primaryAction={{
          content: "Delete",
          destructive: true,
          loading: isDeleting,
          disabled: isDeleting,
          onAction: () => {
            if (!deleteRule) return;
            setDidDelete(true);
            deleteFetcher.submit(
              { intent: "delete", ruleId: deleteRule.id },
              { method: "post" },
            );
          },
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setDeleteRule(null), disabled: isDeleting }]}
      >
        <Modal.Section>
          <Text as="p">
            Delete {deleteRule?.name}? This will also remove its recipients and
            alert history links.
          </Text>
        </Modal.Section>
      </Modal>

      <Modal
        open={bulkDeleteOpen}
        onClose={() => !isBulkDeleting && setBulkDeleteOpen(false)}
        title="Delete alert rules"
        primaryAction={{
          content: "Delete",
          destructive: true,
          loading: isBulkDeleting,
          disabled: isBulkDeleting,
          onAction: handleBulkDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setBulkDeleteOpen(false),
            disabled: isBulkDeleting,
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Delete the selected {selectedResources.length} alert rules? This will
            also remove their recipients and alert history links.
          </Text>
        </Modal.Section>
      </Modal>

      <AlertRuleDetailModal
        rule={selectedRule}
        onClose={() => setSelectedRule(null)}
        onRuleUpdated={handleRuleUpdated}
      />
    </Page>
  );
}

function formatScope(scopeType: string, scopeLabel: string | null) {
  if (scopeType === "all") return "All products";
  return scopeLabel ?? scopeType.charAt(0).toUpperCase() + scopeType.slice(1);
}

function formatSchedule(rule: {
  deliveryMode: string;
  schedule: string | null;
  scheduleDayOfWeek: number | null;
}) {
  if (rule.deliveryMode === "instant") return "Instant";
  if (rule.schedule === "weekly") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `Weekly ${days[rule.scheduleDayOfWeek ?? 0]}`;
  }
  return "Daily";
}

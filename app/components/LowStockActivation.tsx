import { useEffect, useMemo, useState } from "react";
import { useFetcher, useNavigate, useRevalidator } from 'react-router';
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Layout,
  Modal,
  Text,
  TextField,
} from "@shopify/polaris";

import type { AlertDashboardSummary } from "app/services/alert-rules/dashboard.service.server";
import type { AlertRuleView } from "app/services/alert-rules/alert-rule.service.server";
import { AlertRuleDetailModal } from "./AlertRuleDetailModal";

interface PreviewState {
  totalMatching: number;
  belowThreshold: number;
}

interface ActivationResponse {
  success?: boolean;
  error?: string;
  rule?: AlertRuleView;
}

interface LowStockActivationProps {
  summary: AlertDashboardSummary;
  shopEmail: string | null;
}

type WindowWithShopify = Window & {
  shopify?: {
    idToken?: () => Promise<string>;
  };
};

function isActivationResponse(data: unknown): data is ActivationResponse {
  return typeof data === "object" && data !== null;
}

export function LowStockActivation({
  summary,
  shopEmail,
}: LowStockActivationProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const fetcher = useFetcher<ActivationResponse>();
  const [threshold, setThreshold] = useState(
    (summary.defaultThreshold ?? 5).toString(),
  );
  const [draftThreshold, setDraftThreshold] = useState(threshold);
  const [editThresholdOpen, setEditThresholdOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AlertRuleView | null>(null);
  const [preview, setPreview] = useState<PreviewState>({
    totalMatching: summary.totalInventoryItemsCount,
    belowThreshold: summary.productsBelowThresholdCount,
  });
  const [previewError, setPreviewError] = useState<string | null>(null);

  const thresholdNumber = Number(threshold);
  const isActivating = fetcher.state !== "idle";
  const response = isActivationResponse(fetcher.data) ? fetcher.data : null;
  const hasInventoryData = preview.totalMatching > 0;

  useEffect(() => {
    const nextThreshold = (summary.defaultThreshold ?? 5).toString();
    setThreshold(nextThreshold);
    setDraftThreshold(nextThreshold);
    setPreview({
      totalMatching: summary.totalInventoryItemsCount,
      belowThreshold: summary.productsBelowThresholdCount,
    });
  }, [
    summary.defaultThreshold,
    summary.productsBelowThresholdCount,
    summary.totalInventoryItemsCount,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      const nextThreshold = Number(threshold);

      if (!Number.isInteger(nextThreshold) || nextThreshold < 0) {
        return;
      }

      try {
        setPreviewError(null);
        const shopifyWindow = window as WindowWithShopify;
        const token = await shopifyWindow.shopify?.idToken?.();
        const response = await fetch("/api/alert-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            scopeType: "all",
            threshold: nextThreshold,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Preview request failed");
        }

        setPreview((await response.json()) as PreviewState);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Low-stock activation preview failed:", error);
        setPreviewError("Preview is unavailable right now.");
      }
    }

    void loadPreview();

    return () => controller.abort();
  }, [threshold]);

  const helperText = useMemo(() => {
    if (!hasInventoryData) {
      return "Stockup will start monitoring every variant as soon as inventory data is available.";
    }

    if (preview.belowThreshold === 0) {
      return "Nothing is below the threshold right now. Stockup will watch for the first drop.";
    }

    return "These variants are already at risk. Turn on alerts before they become missed sales.";
  }, [hasInventoryData, preview.belowThreshold]);

  const handleActivate = () => {
    fetcher.submit(
      {
        intent: "activate-default-alert",
        defaultThreshold: threshold,
      },
      { method: "post", action: "/app?index" },
    );
  };

  const handleSaveThreshold = () => {
    const nextThreshold = Number(draftThreshold);

    if (!Number.isInteger(nextThreshold) || nextThreshold < 0) {
      return;
    }

    setThreshold(draftThreshold);
    setEditThresholdOpen(false);
  };

  const handleRuleUpdated = (rule: AlertRuleView) => {
    setSelectedRule(rule);
    revalidator.revalidate();
  };

  return (
    <>
      {response?.success ? (
        <Layout.Section>
          <Banner title="Low-stock alerts are on" tone="success">
            <BlockStack gap="200">
              <Text as="p">
                Stockup is now monitoring every variant at {thresholdNumber}{" "}
                units or less.
              </Text>
              <InlineStack gap="200">
                {response.rule ? (
                  <Button
                    variant="plain"
                    onClick={() => setSelectedRule(response.rule ?? null)}
                  >
                    Edit alert rule
                  </Button>
                ) : null}
                <Button variant="plain" onClick={() => navigate("/app/alerts")}>
                  View alert rules
                </Button>
              </InlineStack>
            </BlockStack>
          </Banner>
        </Layout.Section>
      ) : null}

      {response?.error ? (
        <Layout.Section>
          <Banner title="Alert could not be activated" tone="critical">
            <p>{response.error}</p>
          </Banner>
        </Layout.Section>
      ) : null}

      <Layout.Section>
        <Card background="bg-surface-secondary">
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap={true}>
              <InlineStack gap="200" blockAlign="center">
                <Badge tone={preview.belowThreshold > 0 ? "critical" : "info"}>
                  First alert setup
                </Badge>
                <Text as="h2" variant="headingMd">
                  {hasInventoryData
                    ? "We found variants that may run out soon"
                    : "Turn on low-stock alerts"}
                </Text>
              </InlineStack>

              <InlineStack gap="300" blockAlign="center">
                <Button
                  variant="plain"
                  onClick={() => {
                    setDraftThreshold(threshold);
                    setEditThresholdOpen(true);
                  }}
                >
                  Edit threshold
                </Button>
                <Button
                  variant="primary"
                  loading={isActivating}
                  disabled={
                    isActivating ||
                    !Number.isInteger(thresholdNumber) ||
                    thresholdNumber < 0
                  }
                  onClick={handleActivate}
                >
                  Turn on alerts
                </Button>
              </InlineStack>
            </InlineStack>

            <Text as="p" tone="subdued">
              {helperText} Stockup will monitor every variant and email you when
              inventory reaches <strong>{thresholdNumber} units</strong> or
              less.
            </Text>

            {previewError && (
              <Text as="p" tone="critical" variant="bodySm">
                {previewError}
              </Text>
            )}
          </BlockStack>
        </Card>
      </Layout.Section>

      <Modal
        open={editThresholdOpen}
        onClose={() => setEditThresholdOpen(false)}
        title="Edit alert threshold"
        primaryAction={{
          content: "Update preview",
          onAction: handleSaveThreshold,
          disabled:
            !Number.isInteger(Number(draftThreshold)) ||
            Number(draftThreshold) < 0,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setEditThresholdOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" tone="subdued">
              Stockup will monitor every variant and alert you when available
              inventory reaches this number or less.
            </Text>
            <TextField
              label="Alert me at"
              type="number"
              min={0}
              value={draftThreshold}
              onChange={setDraftThreshold}
              autoComplete="off"
              suffix="units"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      <AlertRuleDetailModal
        rule={selectedRule}
        onClose={() => setSelectedRule(null)}
        onRuleUpdated={handleRuleUpdated}
      />
    </>
  );
}

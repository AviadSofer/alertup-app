import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate } from 'react-router';
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Divider,
  InlineStack,
  Modal,
  Text,
} from "@shopify/polaris";

import type { action as editAlertRuleAction } from "../routes/app.alerts.$id";
import {
  formatRuleDelivery,
  formatRuleScope,
  formatRuleTriggered,
} from "../lib/alert-rule-display";
import type { AlertRuleView } from "../services/alert-rules/alert-rule.service.server";
import { AlertRuleQuickEditForm } from "./AlertRuleQuickEditForm";

interface AlertRuleDetailModalProps {
  rule: AlertRuleView | null;
  onClose: () => void;
  onRuleUpdated: (rule: AlertRuleView) => void;
}

type ModalMode = "view" | "edit";

export function AlertRuleDetailModal({
  rule,
  onClose,
  onRuleUpdated,
}: AlertRuleDetailModalProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof editAlertRuleAction>();
  const [mode, setMode] = useState<ModalMode>("view");
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [displayRule, setDisplayRule] = useState<AlertRuleView | null>(rule);

  const isSaving = fetcher.state !== "idle";
  const fetcherError =
    fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined;

  useEffect(() => {
    setDisplayRule(rule);
    setMode("view");
    setSaveTrigger(0);
  }, [rule?.id]);

  const lastHandledData = useRef<typeof fetcher.data>(undefined);

  useEffect(() => {
    if (
      fetcher.data &&
      fetcher.data !== lastHandledData.current &&
      "success" in fetcher.data &&
      fetcher.data.success &&
      fetcher.data.rule
    ) {
      lastHandledData.current = fetcher.data;
      setDisplayRule(fetcher.data.rule);
      onRuleUpdated(fetcher.data.rule);
      setMode("view");
    }
  }, [fetcher.data, onRuleUpdated]);

  const handleClose = useCallback(() => {
    setMode("view");
    onClose();
  }, [onClose]);

  const handleSave = useCallback(
    (formData: FormData) => {
      if (!displayRule) return;
      fetcher.submit(formData, {
        method: "post",
        action: `/app/alerts/${displayRule.id}`,
      });
    },
    [displayRule, fetcher],
  );

  const open = rule !== null;
  const activeRule = displayRule ?? rule;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={activeRule?.name ?? "Alert rule"}
      primaryAction={
        mode === "view"
          ? {
              content: "Edit",
              onAction: () => setMode("edit"),
            }
          : {
              content: "Save",
              loading: isSaving,
              disabled: isSaving,
              onAction: () => setSaveTrigger((n) => n + 1),
            }
      }
      secondaryActions={
        mode === "view"
          ? [{ content: "Close", onAction: handleClose }]
          : [
              {
                content: "Cancel",
                onAction: () => {
                  setDisplayRule(rule);
                  setMode("view");
                },
                disabled: isSaving,
              },
            ]
      }
    >
      {activeRule && mode === "view" ? (
        <Modal.Section>
          <BlockStack gap="400">
            {fetcher.data && "success" in fetcher.data && fetcher.data.success ? (
              <Banner title="Changes saved" tone="success" />
            ) : null}

            <InlineStack gap="200" blockAlign="center">
              <Badge tone={activeRule.enabled ? "success" : undefined}>
                {activeRule.enabled ? "Active" : "Off"}
              </Badge>
              <Text as="span" tone="subdued" variant="bodySm">
                {formatRuleTriggered(activeRule)}
              </Text>
            </InlineStack>

            <Divider />

            <BlockStack gap="300">
              <DetailRow
                label="Scope"
                value={formatRuleScope(activeRule.scopeType, activeRule.scopeLabel)}
              />
              <DetailRow
                label="Threshold"
                value={`≤ ${activeRule.threshold} units`}
              />
              {activeRule.maxStockLevel !== null && (
                <DetailRow
                  label="Max stock level"
                  value={`≤ ${activeRule.maxStockLevel} units`}
                />
              )}
              {activeRule.locationName && (
                <DetailRow label="Location" value={activeRule.locationName} />
              )}
              <DetailRow
                label="Delivery"
                value={formatRuleDelivery(
                  activeRule.deliveryMode,
                  activeRule.schedule,
                  activeRule.scheduleDayOfWeek,
                )}
              />
            </BlockStack>

            {activeRule.recipients.length > 0 && (
              <>
                <Divider />
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Recipients
                  </Text>
                  <BlockStack gap="100">
                    {activeRule.recipients.map((recipient) => (
                      <Text key={recipient.id} as="p" variant="bodyMd">
                        {recipient.email}
                      </Text>
                    ))}
                  </BlockStack>
                </BlockStack>
              </>
            )}

            <InlineStack gap="200" blockAlign="center">
              <Text as="p" tone="subdued" variant="bodySm">
                Need to change scope or locations?
              </Text>
              <Button
                variant="plain"
                onClick={() => {
                  handleClose();
                  navigate(`/app/alerts/${activeRule.id}`);
                }}
              >
                Open full editor
              </Button>
            </InlineStack>
          </BlockStack>
        </Modal.Section>
      ) : null}

      {activeRule && mode === "edit" ? (
        <Modal.Section>
          <AlertRuleQuickEditForm
            rule={activeRule}
            error={fetcherError}
            saveTrigger={saveTrigger}
            onSave={handleSave}
          />
        </Modal.Section>
      ) : null}
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <InlineStack align="space-between" blockAlign="start" wrap={false}>
      <Text as="span" tone="subdued">
        {label}
      </Text>
      <Text as="span" variant="bodyMd" fontWeight="medium" alignment="end">
        {value}
      </Text>
    </InlineStack>
  );
}

import { useCallback, useState } from "react";
import { useNavigate, useRevalidator, useFetcher } from 'react-router';
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  EmptyState,
  Icon,
  InlineStack,
  Layout,
  Page,
  Text,
} from "@shopify/polaris";
import {
  AlertTriangleIcon,
  AutomationIcon,
  ChevronRightIcon,
  ClockIcon,
  EmailIcon,
  NotificationIcon,
} from "@shopify/polaris-icons";
import { motion } from "framer-motion";

import type { AlertDashboardSummary } from "../services/alert-rules/dashboard.service.server";
import type { AlertRuleView } from "../services/alert-rules/alert-rule.service.server";
import {
  formatRelativeDate,
  formatRuleDelivery,
  formatRuleScope,
} from "../lib/alert-rule-display";
import { AlertRuleDetailModal } from "./AlertRuleDetailModal";
import { SetDefaultThresholdModal } from "./SetDefaultThresholdModal";
import { LearnAlertRulesModal } from "./LearnAlertRulesModal";
import { LowStockActivation } from "./LowStockActivation";
import { EmptyStateAnimation } from "./Animations";
import { ToggleSwitch } from "./ToggleSwitch";
import styles from "./PivotDashboard.module.css";

const MAX_RULES_PREVIEW = 5;

export function PivotDashboard({
  summary,
  shopEmail,
}: {
  summary: AlertDashboardSummary;
  shopEmail: string | null;
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [selectedRule, setSelectedRule] = useState<AlertRuleView | null>(null);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  const handleRuleUpdated = useCallback(
    (updated: AlertRuleView) => {
      setSelectedRule(updated);
      revalidator.revalidate();
    },
    [revalidator],
  );
  const previewRules = summary.rules.slice(0, MAX_RULES_PREVIEW);
  const hasMoreRules = summary.rules.length > MAX_RULES_PREVIEW;
  const needsAttention = summary.productsBelowThresholdCount > 0;

  const defaultRule = summary.rules.find(
    (r) =>
      r.scopeType === "all" &&
      (r.name === "Low stock - all products" ||
        r.name === "Default Alert Rule")
  );

  const defaultRuleFetcher = useFetcher();
  const isDefaultRuleToggling = defaultRuleFetcher.state !== "idle";
  const defaultRuleEnabled = defaultRuleFetcher.formData
    ? defaultRuleFetcher.formData.get("enabled") === "true"
    : defaultRule
    ? defaultRule.enabled
    : false;

  const handleDefaultRuleToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!defaultRule) return;
      const newEnabled = e.target.checked;
      defaultRuleFetcher.submit(
        {
          intent: "toggle",
          ruleId: defaultRule.id,
          enabled: String(newEnabled),
        },
        { method: "post", action: "/app/alerts?index" }
      );
    },
    [defaultRule, defaultRuleFetcher]
  );

  return (
    <Page
      title="Dashboard"
      primaryAction={{
        content: "Create rule",
        onAction: () => navigate("/app/alerts/new"),
      }}
      secondaryActions={[
        {
          content: "Set Default Threshold",
          onAction: () => setThresholdOpen(true),
        },
      ]}
    >
      <Layout>
        {!summary.hasRules && (
          <LowStockActivation summary={summary} shopEmail={shopEmail} />
        )}
        <Layout.Section>
          <Card padding="0">
            <div className={styles.unifiedMetricsBar}>
              <SummaryMetric
                label="Active rules"
                value={summary.activeRulesCount}
                icon={AutomationIcon}
              />
              <div className={styles.metricDivider} />
              <SummaryMetric
                label={`Below default (≤ ${summary.defaultThreshold ?? 5})`}
                value={summary.productsBelowThresholdCount}
                valueTone={needsAttention ? "caution" : undefined}
                onClick={
                  needsAttention ? () => navigate("/app/inventory") : undefined
                }
                hint={needsAttention ? "View inventory" : undefined}
                icon={AlertTriangleIcon}
                badge={
                  defaultRule ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <ToggleSwitch
                        checked={defaultRuleEnabled}
                        onChange={handleDefaultRuleToggle}
                        disabled={isDefaultRuleToggling}
                        loading={isDefaultRuleToggling}
                      />
                    </div>
                  ) : undefined
                }
              />
              <div className={styles.metricDivider} />
              <SummaryMetric
                label="Alerts this week"
                value={summary.alertsSentThisWeek}
                icon={NotificationIcon}
              />
            </div>
          </Card>
        </Layout.Section>

        {!summary.hasRules ? (
          <Layout.Section>
            <Card>
              <BlockStack gap="400" inlineAlign="center">
                <Box paddingBlockStart="400">
                  <EmptyStateAnimation
                    heading="No alert rules yet"
                    description="Start monitoring low stock by creating a rule for all products, a collection, vendor, product, or variant."
                  />
                </Box>
                <Box paddingBlockEnd="400">
                  <InlineStack gap="300" blockAlign="center" align="center">
                    <Button onClick={() => setLearnOpen(true)}>
                      Learn about alert rules
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => navigate("/app/alerts/new")}
                    >
                      Create your first rule
                    </Button>
                  </InlineStack>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        ) : (
          <Layout.Section>
            <Card padding="0">
              <Box padding="400" paddingBlockEnd="300">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingMd">
                      Alert rules
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {summary.rules.length} rule
                      {summary.rules.length === 1 ? "" : "s"} configured
                    </Text>
                  </BlockStack>
                  <Button
                    variant="plain"
                    onClick={() => navigate("/app/alerts")}
                  >
                    View all
                  </Button>
                </InlineStack>
              </Box>

              <Divider />

              <Box padding="200" paddingBlockStart="100">
                <BlockStack gap="050">
                  {previewRules.map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      onSelect={() => setSelectedRule(rule)}
                    />
                  ))}
                </BlockStack>
              </Box>

              {hasMoreRules && (
                <Box padding="300" paddingBlockStart="0">
                  <Button
                    variant="plain"
                    fullWidth
                    onClick={() => navigate("/app/alerts")}
                  >
                    {`View all ${summary.rules.length} rules`}
                  </Button>
                </Box>
              )}
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card padding="0">
            <Box padding="400" paddingBlockEnd="300">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="050">
                  <Text as="h2" variant="headingMd">
                    Recent alerts
                  </Text>
                  <Text as="p" tone="subdued" variant="bodySm">
                    Latest notifications sent to your team
                  </Text>
                </BlockStack>
                <Button
                  variant="plain"
                  onClick={() => navigate("/app/alerts/history")}
                >
                  View history
                </Button>
              </InlineStack>
            </Box>

            <Divider />

            <Box padding="400" paddingBlockStart="300">
              {summary.recentAlerts.length > 0 ? (
                <BlockStack gap="300">
                  {summary.recentAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className={styles.alertRow}>
                        <InlineStack
                          align="space-between"
                          blockAlign="center"
                          wrap={false}
                        >
                          <InlineStack
                            gap="300"
                            blockAlign="center"
                            wrap={false}
                          >
                            <div
                              className={styles.metricIconWrap}
                              style={{ background: "#fee2e2" }}
                            >
                              <Icon source={NotificationIcon} tone="critical" />
                            </div>
                            <BlockStack gap="050">
                              <Text
                                as="span"
                                variant="bodyMd"
                                fontWeight="semibold"
                              >
                                {alert.productTitle}
                              </Text>
                              <InlineStack gap="200" wrap>
                                {alert.ruleName && (
                                  <Badge tone="info">{alert.ruleName}</Badge>
                                )}
                                <Text as="span" tone="subdued" variant="bodySm">
                                  <InlineStack gap="100" blockAlign="center">
                                    <Icon source={ClockIcon} tone="subdued" />
                                    {formatAlertDate(alert.sentAt)}
                                  </InlineStack>
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </InlineStack>

                          <Badge tone="critical">{`${alert.currentStock} left`}</Badge>
                        </InlineStack>
                      </div>
                    </motion.div>
                  ))}
                </BlockStack>
              ) : (
                <EmptyStateAnimation
                  heading="No alerts sent yet"
                  description="When a rule triggers, you'll see the latest notifications here."
                  svg={<AlertsEmptyIllustration />}
                />
              )}
            </Box>
          </Card>
        </Layout.Section>
      </Layout>

      <AlertRuleDetailModal
        rule={selectedRule}
        onClose={() => setSelectedRule(null)}
        onRuleUpdated={handleRuleUpdated}
      />

      <SetDefaultThresholdModal
        open={thresholdOpen}
        onClose={() => setThresholdOpen(false)}
        defaultThreshold={summary.defaultThreshold}
      />

      <LearnAlertRulesModal
        open={learnOpen}
        onClose={() => setLearnOpen(false)}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SummaryMetric({
  label,
  value,
  valueTone,
  onClick,
  hint,
  icon,
  badge,
}: {
  label: string;
  value: number;
  valueTone?: "caution" | "info" | "success";
  onClick?: () => void;
  hint?: string;
  icon?: any;
  badge?: React.ReactNode;
}) {
  const rootClass = onClick
    ? `${styles.summaryMetric} ${styles.summaryMetricClickable}`
    : styles.summaryMetric;

  return (
    <div
      className={rootClass}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.cardHeader}>
        <InlineStack gap="200" blockAlign="center">
          <Text as="p" tone="subdued" variant="headingSm" fontWeight="medium">
            {label}
          </Text>
          {badge}
        </InlineStack>
        {icon && (
          <div className={styles.iconBox}>
            <Icon source={icon} tone="subdued" />
          </div>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.valueText} data-tone={valueTone}>
          {value.toLocaleString()}
        </div>
        {hint && onClick && (
          <div className={styles.actionHint}>
            <Text as="span" variant="bodySm" tone="magic">
              {hint} &rarr;
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  onSelect,
}: {
  rule: AlertDashboardSummary["rules"][number];
  onSelect: () => void;
}) {
  const fetcher = useFetcher();

  // Optimistic UI state
  const isToggling = fetcher.state !== "idle";
  const enabled = fetcher.formData
    ? fetcher.formData.get("enabled") === "true"
    : rule.enabled;

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newEnabled = e.target.checked;
    fetcher.submit(
      { intent: "toggle", ruleId: rule.id, enabled: String(newEnabled) },
      { method: "post", action: "/app/alerts?index" },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={styles.ruleRow}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: enabled ? "#22c55e" : "#a1a1aa",
                flexShrink: 0,
                boxShadow: enabled
                  ? "0 0 0 3px rgba(34, 197, 94, 0.2)"
                  : undefined,
                transition: "background-color 0.2s, box-shadow 0.2s",
              }}
              aria-hidden
            />
            <BlockStack gap="150">
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                {rule.name}
              </Text>
              <InlineStack gap="200" wrap>
                <Badge tone="info">
                  {formatRuleScope(rule.scopeType, rule.scopeLabel)}
                </Badge>
                <Text as="span" tone="subdued" variant="bodySm">
                  ≤ {rule.threshold} units
                </Text>
                <Text as="span" tone="subdued" variant="bodySm">
                  ·{" "}
                  {formatRuleDelivery(
                    rule.deliveryMode,
                    rule.schedule,
                    rule.scheduleDayOfWeek,
                  )}
                </Text>
                {rule.recipientCount > 0 && (
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={EmailIcon} tone="subdued" />
                    <Text as="span" tone="subdued" variant="bodySm">
                      {rule.recipientCount} recipient
                      {rule.recipientCount === 1 ? "" : "s"}
                    </Text>
                  </InlineStack>
                )}
              </InlineStack>
            </BlockStack>
          </InlineStack>

          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <BlockStack gap="050" inlineAlign="end">
              <ToggleSwitch
                checked={enabled}
                onChange={handleToggle}
                disabled={isToggling}
                loading={isToggling}
                label={enabled ? "Active" : "Off"}
              />
              <Text as="span" tone="subdued" variant="bodySm">
                {rule.lastTriggeredAt
                  ? `Triggered ${formatRelativeDate(rule.lastTriggeredAt)}`
                  : "Never triggered"}
              </Text>
            </BlockStack>
            <Icon source={ChevronRightIcon} tone="subdued" />
          </InlineStack>
        </InlineStack>
      </div>
    </motion.div>
  );
}

function AlertsEmptyIllustration() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect x="20" y="24" width="56" height="48" rx="10" fill="#EFF6FF" />
      <path
        d="M48 36c-6 0-11 4-11 9v4l-3 3h28l-3-3v-4c0-5-5-9-11-9z"
        fill="#93C5FD"
      />
      <circle cx="68" cy="32" r="10" fill="#FEF3C7" />
      <path
        d="M68 28v8M64 32h8"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatAlertDate(isoDate: string) {
  const date = new Date(isoDate);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear().toString().slice(-2);

  return `${hours}:${minutes}, ${day}/${month}/${year}`;
}

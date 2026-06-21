import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BlockStack, Button, Modal, Text, Icon } from "@shopify/polaris";
import {
  NotificationIcon,
  ImageIcon,
  EmailIcon,
  ProductIcon,
  InfoIcon,
} from "@shopify/polaris-icons";

import { AlertRuleQuickEditForm } from "app/components/AlertRuleQuickEditForm";
import { parseAlertRuleFormData } from "app/components/AlertRuleForm";
import type {
  AlertDeliveryMode,
  AlertRuleView,
  AlertSchedule,
} from "app/services/alert-rules/alert-rule.service.server";
import { type PreviewState } from "./OnboardingInventoryScan";

interface OnboardingFirstAlertSetupProps {
  onNext: () => void;
  onBack: () => void;
  shopEmail: string | null;
  initialPreview: PreviewState;
  selectedThreshold?: number;
}

function createDraftRule(
  shopEmail: string | null,
  threshold: number,
): AlertRuleView {
  const recipientEmail = shopEmail?.trim();
  const now = new Date().toISOString();

  return {
    id: "draft-default-low-stock-rule",
    shopId: "draft",
    name: "Low stock - all products",
    enabled: true,
    scopeType: "all",
    scopeValue: null,
    scopeLabel: null,
    threshold: threshold,
    maxStockLevel: null,
    locationId: null,
    locationName: null,
    deliveryMode: "instant",
    schedule: null,
    scheduleDayOfWeek: null,
    lastTriggeredAt: null,
    triggerCount: 0,
    createdAt: now,
    updatedAt: now,
    recipientCount: recipientEmail ? 1 : 0,
    recipients: recipientEmail
      ? [{ id: "draft-recipient-0", email: recipientEmail }]
      : [],
  };
}

function formatDelivery(rule: AlertRuleView) {
  if (rule.deliveryMode === "instant") return "Instant email";
  if (rule.schedule === "weekly") return "Weekly email";
  return "Daily email";
}

export function OnboardingFirstAlertSetup({
  onNext,
  onBack,
  shopEmail,
  initialPreview,
  selectedThreshold = 5,
}: OnboardingFirstAlertSetupProps) {
  const [draftRule, setDraftRule] = useState(() =>
    createDraftRule(shopEmail, selectedThreshold),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [saveTrigger, setSaveTrigger] = useState(0);

  useEffect(() => {
    setDraftRule(createDraftRule(shopEmail, selectedThreshold));
  }, [shopEmail, selectedThreshold]);

  const handleDraftSave = async (formData: FormData) => {
    const input = parseAlertRuleFormData(formData);
    const recipients = input.recipients
      .map((email) => email.trim())
      .filter(Boolean)
      .map((email, index) => ({
        id: `draft-recipient-${index}`,
        email,
      }));

    const nextRule: AlertRuleView = {
      ...draftRule,
      name: input.name,
      enabled: input.enabled ?? true,
      threshold: input.threshold,
      deliveryMode: input.deliveryMode as AlertDeliveryMode,
      schedule: input.schedule as AlertSchedule | null,
      scheduleDayOfWeek: input.scheduleDayOfWeek ?? null,
      recipients,
      recipientCount: recipients.length,
      updatedAt: new Date().toISOString(),
    };

    setDraftRule(nextRule);
    setEditOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "80px",
            alignItems: "center",
            flex: 1,
          }}
        >
          {/* Left Column */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  padding: 12,
                  background: "#F1F8F5",
                  borderRadius: "50%",
                  display: "inline-flex",
                }}
              >
                <Icon source={NotificationIcon} tone="success" />
              </div>
            </div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Text variant="headingLg" as="h2">
                Never miss a stockout again
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text as="p" tone="subdued">
                  {initialPreview?.belowThreshold
                    ? `We found ${initialPreview.belowThreshold} products with ${draftRule.threshold} or fewer units. Set up an alert to get notified before they sell out.`
                    : `Get an email whenever any product drops to ${draftRule.threshold} units or less — so you can restock before it sells out.`}
                </Text>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 16,
                border: "1px solid #e5e7eb",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text as="h3" variant="headingMd">
                  Your alert rule
                </Text>
                <Button
                  variant="plain"
                  onClick={() => {
                    setSaveTrigger(0);
                    setEditOpen(true);
                  }}
                >
                  Edit
                </Button>
              </div>

              <BlockStack gap="300">
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ marginTop: "2px" }}>
                    <Icon source={ProductIcon} tone="subdued" />
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Condition
                    </Text>
                    <Text as="p" tone="subdued">
                      Any product drops to {draftRule.threshold} units or less
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ marginTop: "2px" }}>
                    <Icon source={EmailIcon} tone="subdued" />
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Action
                    </Text>
                    <Text as="p" tone="subdued">
                      Send {formatDelivery(draftRule).toLowerCase()} to{" "}
                      <span style={{ fontWeight: 500, color: "#202223" }}>
                        {draftRule.recipients[0]?.email || "your email"}
                      </span>
                    </Text>
                  </div>
                </div>
              </BlockStack>
            </div>

            <div
              style={{
                marginTop: 12,
                background: "#f4f6f8",
                padding: "10px 14px",
                borderRadius: 8,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ color: "#5c5f62", flexShrink: 0 }}>
                <Icon source={InfoIcon} />
              </div>
              <Text as="p" variant="bodySm" tone="subdued">
                <strong>Need more control?</strong> Create custom rules from
                your dashboard later.
              </Text>
            </div>
          </div>

          {/* Right Column */}
          <div
            style={{
              flex: 1,
              minWidth: 360,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
              }}
            >
              <div
                style={{
                  background: "#f9fafb",
                  padding: "10px 16px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Text as="p" variant="bodySm" tone="subdued">
                  New Message
                </Text>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  Low stock alert from Stockup
                </Text>
              </div>
              <div style={{ padding: 16 }}>
                <Text as="p" variant="bodyMd">
                  Hi there,
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Text as="p" variant="bodyMd">
                    The following products have dropped to {draftRule.threshold}{" "}
                    units or less:
                  </Text>
                </div>

                <div style={{ marginTop: 12 }}>
                  <BlockStack gap="200">
                    {initialPreview?.topItems?.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "#f3f4f6",
                            borderRadius: "4px",
                            overflow: "hidden",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productTitle}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Icon source={ImageIcon} tone="subdued" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            as="p"
                            variant="bodySm"
                            fontWeight="medium"
                            truncate
                          >
                            {item.productTitle}
                          </Text>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <Text as="p" tone="critical" fontWeight="bold">
                            {item.availableQuantity} left
                          </Text>
                        </div>
                      </div>
                    ))}
                    {(!initialPreview?.topItems ||
                      initialPreview.topItems.length === 0) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                          opacity: 0.5,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "#e5e7eb",
                            borderRadius: "4px",
                          }}
                        ></div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              height: 10,
                              background: "#e5e7eb",
                              borderRadius: 4,
                              width: "60%",
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </BlockStack>
                </div>
                <div style={{ marginTop: 24 }}>
                  <Button fullWidth disabled>
                    Restock Inventory
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: 360 }}>
            <Button variant="primary" size="large" fullWidth onClick={onNext}>
              Continue
            </Button>
            <div style={{ marginTop: 12 }}>
              <Button variant="monochromePlain" fullWidth onClick={onBack}>
                Back
              </Button>
            </div>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Text as="p" tone="subdued" variant="bodySm">
                The alert will activate after the free-trial step.
              </Text>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={draftRule.name}
        primaryAction={{
          content: "Save",
          onAction: () => setSaveTrigger((current) => current + 1),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setEditOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <AlertRuleQuickEditForm
            rule={draftRule}
            saveTrigger={saveTrigger}
            onSave={handleDraftSave}
          />
        </Modal.Section>
      </Modal>
    </motion.div>
  );
}

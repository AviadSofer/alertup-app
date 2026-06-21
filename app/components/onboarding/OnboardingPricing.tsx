import { Text, Button, InlineStack, Icon } from "@shopify/polaris";
import {
  CheckIcon,
  EmailIcon,
  AlertBubbleIcon,
  MagicIcon,
} from "@shopify/polaris-icons";
import { Form } from 'react-router';
import { motion } from "framer-motion";

interface OnboardingPricingProps {
  onBack: () => void;
  onNext: () => void;
  alertSummary?: {
    threshold: number;
    email: string | null;
    productsCount: number;
  };
}

export function OnboardingPricing({
  onBack,
  onNext,
  alertSummary,
}: OnboardingPricingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "64px",
          alignItems: "center",
          width: "100%",
          maxWidth: 900,
        }}
      >
        {/* Left Column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#E8F5E9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ color: "#008060" }}>
              <Icon source={CheckIcon} />
            </div>
          </motion.div>

          <Text variant="heading2xl" as="h1">
            Your alert is ready
          </Text>

          <div style={{ marginTop: 12, marginBottom: 32 }}>
            <Text as="p" variant="bodyLg" tone="subdued">
              One last step — start your free trial to activate everything.
            </Text>
          </div>

          <div style={{ width: "100%" }}>
            <Button variant="primary" size="large" fullWidth onClick={onNext}>
              Start Free Trial
            </Button>
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <Text as="p" variant="bodySm" tone="subdued">
                You'll be taken to Shopify's secure billing page
              </Text>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Button variant="monochromePlain" size="slim" onClick={onBack}>
              Back
            </Button>
          </div>
        </div>

        {/* Right Column */}
        {alertSummary && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{ flex: 1 }}
          >
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 16,
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                border: "1px solid #e5e7eb",
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
                width: "100%",
              }}
            >
              <Text variant="headingSm" as="h3" tone="subdued">
                What you've set up
              </Text>

              <InlineStack gap="300" blockAlign="center">
                <div style={{ color: "#008060" }}>
                  <Icon source={AlertBubbleIcon} />
                </div>
                <Text as="span" variant="bodyMd">
                  Alert when stock drops below{" "}
                  <strong>{alertSummary.threshold} units</strong>
                </Text>
              </InlineStack>

              {alertSummary.email && (
                <InlineStack gap="300" blockAlign="center">
                  <div style={{ color: "#008060" }}>
                    <Icon source={EmailIcon} />
                  </div>
                  <Text as="span" variant="bodyMd">
                    Notifications sent to <strong>{alertSummary.email}</strong>
                  </Text>
                </InlineStack>
              )}

              <InlineStack gap="300" blockAlign="center">
                <div style={{ color: "#008060" }}>
                  <Icon source={CheckIcon} />
                </div>
                <Text as="span" variant="bodyMd">
                  Monitoring{" "}
                  <strong>{alertSummary.productsCount} products</strong>
                </Text>
              </InlineStack>

              <div
                style={{
                  borderTop: "1px solid #e1e3e5",
                  margin: "8px 0",
                  paddingTop: 16,
                }}
              >
                <InlineStack gap="200" blockAlign="start">
                  <div
                    style={{ color: "#008060", marginTop: 2, flexShrink: 0 }}
                  >
                    <Icon source={MagicIcon} />
                  </div>
                  <div>
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Plus, unlock custom alerts
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Create tailored rules for specific collections, locations,
                      and schedules in your dashboard.
                    </Text>
                  </div>
                </InlineStack>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

import {
  Modal,
  Text,
  BlockStack,
  Icon,
  InlineStack,
  Box,
} from "@shopify/polaris";
import { AutomationIcon, EmailIcon, ClockIcon } from "@shopify/polaris-icons";

interface LearnAlertRulesModalProps {
  open: boolean;
  onClose: () => void;
}

export function LearnAlertRulesModal({
  open,
  onClose,
}: LearnAlertRulesModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Alert Rules Work"
      primaryAction={{
        content: "Got it, thanks!",
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            Alert rules allow you to put your inventory monitoring on autopilot.
            Instead of manually checking stock levels, Stockup tracks them and
            notifies you before you run out.
          </Text>

          <BlockStack gap="300">
            <InlineStack wrap={false} gap="300" blockAlign="start">
              <Box paddingBlockStart="050">
                <Icon source={AutomationIcon} tone="magic" />
              </Box>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm">
                  Flexible Targeting
                </Text>
                <Text as="p" tone="subdued">
                  Set a global threshold for all products, or create specific
                  rules for your best-selling collections, vendors, or specific
                  variants.
                </Text>
              </BlockStack>
            </InlineStack>

            <InlineStack wrap={false} gap="300" blockAlign="start">
              <Box paddingBlockStart="050">
                <Icon source={ClockIcon} tone="magic" />
              </Box>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm">
                  Custom Schedules
                </Text>
                <Text as="p" tone="subdued">
                  Get notified instantly the moment stock drops, or opt to
                  receive a daily or weekly digest of all low-stock items.
                </Text>
              </BlockStack>
            </InlineStack>

            <InlineStack wrap={false} gap="300" blockAlign="start">
              <Box paddingBlockStart="050">
                <Icon source={EmailIcon} tone="magic" />
              </Box>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm">
                  Smart Routing
                </Text>
                <Text as="p" tone="subdued">
                  Send alerts to yourself, your store manager, or even directly
                  to your suppliers so they can prepare your next order.
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

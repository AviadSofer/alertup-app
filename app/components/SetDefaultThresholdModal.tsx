import { useState, useEffect } from "react";
import { Modal, TextField, BlockStack, Text, Box, Banner } from "@shopify/polaris";
import { useFetcher } from 'react-router';
import { AutomationIcon } from "@shopify/polaris-icons";

interface SetDefaultThresholdModalProps {
  open: boolean;
  onClose: () => void;
  defaultThreshold: number | null;
}

export function SetDefaultThresholdModal({
  open,
  onClose,
  defaultThreshold,
}: SetDefaultThresholdModalProps) {
  const fetcher = useFetcher();
  const [threshold, setThreshold] = useState(
    defaultThreshold?.toString() ?? "",
  );

  const isSaving = fetcher.state !== "idle";
  const [didSubmit, setDidSubmit] = useState(false);

  // Close modal when successful
  useEffect(() => {
    if (didSubmit && fetcher.state === "idle" && fetcher.data && (fetcher.data as any).success) {
      setDidSubmit(false);
      onClose();
    }
  }, [fetcher.state, fetcher.data, onClose, didSubmit]);

  // Sync state when defaultThreshold changes from outside
  useEffect(() => {
    setThreshold(defaultThreshold?.toString() ?? "");
  }, [defaultThreshold]);

  const handleSave = () => {
    setDidSubmit(true);
    fetcher.submit(
      { intent: "set-default-threshold", defaultThreshold: threshold },
      { method: "post", action: "/app/alerts?index" },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set store default threshold"
      primaryAction={{
        content: "Save rule",
        loading: isSaving,
        disabled: isSaving,
        onAction: handleSave,
      }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Banner tone="info" icon={AutomationIcon}>
            <p>
              Setting a default threshold automatically creates an active alert rule for <strong>all products</strong> in your store.
            </p>
          </Banner>
          
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              How it works
            </Text>
            <Text as="p" tone="subdued">
              We will instantly notify you via email whenever any product's inventory drops to this number or below. You can always override this by creating custom rules for specific collections or products.
            </Text>
          </BlockStack>

          <Box paddingBlockStart="200">
            <TextField
              label="Alert me when stock falls to or below:"
              type="number"
              min={0}
              value={threshold}
              onChange={setThreshold}
              autoComplete="off"
              suffix="units"
            />
          </Box>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

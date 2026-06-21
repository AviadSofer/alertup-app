import { Text, Button, BlockStack } from "@shopify/polaris";
import { OnboardingPermissionsAnimation } from "app/components/Animations";

export function OnboardingPermissions({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <BlockStack gap="400" align="center">
      <OnboardingPermissionsAnimation />
      <Text variant="headingLg" as="h1" alignment="center">
        Your Data, Your Control
      </Text>

      <Text variant="headingMd" as="h2" alignment="center" tone="subdued">
        We only read data — we never edit your store.
      </Text>
      <Button variant="primary" size="large" fullWidth onClick={onNext}>
        Continue
      </Button>
      <Button variant="monochromePlain" size="slim" onClick={onBack} fullWidth>
        Back
      </Button>
    </BlockStack>
  );
}

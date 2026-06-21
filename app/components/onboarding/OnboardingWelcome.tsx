import { Text, Button, BlockStack } from "@shopify/polaris";
import { OnboardingWelcomeAnimation } from "app/components/Animations";

export function OnboardingWelcome({ onNext }: { onNext: () => void }) {
  return (
    <BlockStack gap="400" align="center">
      <OnboardingWelcomeAnimation />
      <Text variant="headingLg" as="h2" alignment="center">
        Welcome to Stockup
      </Text>
      <Text variant="headingMd" as="h3" alignment="center">
        Your smarter inventory starts here — let’s dive in.
      </Text>
      <Button variant="primary" size="large" fullWidth onClick={onNext}>
        Continue
      </Button>
      <Text as="p" alignment="center" tone="subdued">
        Next: Connect your store and see how Stockup works for you.
      </Text>
    </BlockStack>
  );
}

import { Spinner, Text } from "@shopify/polaris";

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <Spinner size="large" />
      <Text as="p" variant="bodyMd">
        {text}
      </Text>
    </div>
  );
}

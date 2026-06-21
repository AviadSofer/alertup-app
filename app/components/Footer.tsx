import { Text } from "@shopify/polaris";

export function Footer() {
  return (
    <div
      style={{
        padding: "2rem 0",
        borderTop: "1px solid #E5E7EB",
        textAlign: "center",
        color: "#4A5568",
      }}
    >
      <Text as="p" variant="bodyLg">
        <Text as="span" fontWeight="bold">
          Stockup
        </Text>{" "}
        provides smart, actionable inventory insights to help you stay in
        control without the guesswork.
      </Text>
      <Text as="p" variant="headingMd" fontWeight="bold">
        All calculations are based on order data from the past 30 days and may
        be adjusted as new patterns emerge.
      </Text>
      <Text as="p" variant="bodyLg">
        This is an early version of Stockup — we're just getting started, and
        your feedback means the world to us 💙
      </Text>
      <div
        style={{ marginTop: "0.5rem", color: "#4A5568", fontSize: "0.875rem" }}
      >
        © {new Date().getFullYear()} Stockup. All rights reserved.
      </div>
    </div>
  );
}

import { Card, Text, BlockStack, Divider } from "@shopify/polaris";
import { SyncInventoryButton } from "./SyncInventoryButton";

export function InventorySyncPanel() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Card>
        <BlockStack gap="400">
          <div style={{ textAlign: "center" }}>
            <Text as="h2" variant="headingLg" fontWeight="bold">
              Inventory Synchronization
            </Text>
            <Divider />
          </div>

          <div style={{ padding: "0 16px" }}>
            <Text as="p" variant="bodyMd">
              Use this option to manually synchronize inventory data from your
              Shopify store. The system uses this data to predict when your
              products will run out of stock.
            </Text>
          </div>

          <SyncInventoryButton />

          <div style={{ padding: "0 16px", textAlign: "center" }}>
            <Text as="p" variant="bodySm" tone="subdued">
              The system automatically synchronizes inventory whenever stock
              levels change. You can manually synchronize at any time using this
              button.
            </Text>
          </div>
        </BlockStack>
      </Card>
    </div>
  );
}

import {
  Card,
  Text,
  BlockStack,
  Box,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import {
  useProductInsightLogsQuery,
  type ProductInsightLog,
} from "../hooks/use-product-insight-logs.query";
import { LoadingSpinner } from "./LoadingSpinner";
import { formatDate } from "app/lib/code-utils";

export function OutOfStockPanel() {
  const { data: insightLogs, isLoading } = useProductInsightLogsQuery();

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Out of Stock Insights
          </Text>
          <Text as="p" variant="bodyMd">
            When a product goes out of stock, the system logs this information
            to help you track inventory patterns over time.
          </Text>

          {isLoading ? (
            <LoadingSpinner text="Loading insight logs..." />
          ) : insightLogs && insightLogs.length > 0 ? (
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                Products currently or previously out of stock:
              </Text>
              {insightLogs.map((log: ProductInsightLog) => (
                <Box
                  key={log.id}
                  paddingBlock="300"
                  paddingInline="400"
                  borderColor="border"
                  borderWidth="025"
                  borderRadius="200"
                >
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="space-between">
                      <Text as="span" variant="headingSm">
                        {log.productTitle}
                        {log.variantTitle && ` - ${log.variantTitle}`}
                      </Text>
                      <Badge tone="critical">Out of Stock</Badge>
                    </InlineStack>
                    <InlineStack gap="200">
                      <Text as="span" variant="bodySm" tone="subdued">
                        First detected: {formatDate(log.firstDetectedAt)}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Last detected: {formatDate(log.lastDetectedAt)}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </Box>
              ))}
            </BlockStack>
          ) : (
            <Text as="p" variant="bodyMd">
              No out of stock insights have been logged yet.
            </Text>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

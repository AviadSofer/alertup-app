import { useCallback, useState } from "react";
import { InsightCardList } from "./InsightCardList";
import { CollapsibleCard } from "./CollapsibleCard";
import { Section } from "./Section";
import { getTodayDateString } from "app/lib/code-utils";
import { useHideProductMutation } from "app/hooks/use-hide-product.mutation";
import { useProductInsightsQuery } from "app/hooks/use-product-insights.query";
import {
  Button,
  ButtonGroup,
  InlineStack,
  Text,
  Tooltip,
} from "@shopify/polaris";
import { SALES_PERIOD_OPTIONS } from "app/constants";

interface InsightsBoxProps {
  title?: string;
}

export function InsightsBox({ title = "Today's Insights" }: InsightsBoxProps) {
  const [historyDays, setHistoryDays] = useState("30");
  const { data: productInsights, isFetching } = useProductInsightsQuery(
    undefined,
    Number(historyDays),
  );

  const todayString = getTodayDateString();

  const hideInsightMutation = useHideProductMutation();

  const handleHideInsight = useCallback(
    (insightId: string) => {
      const [productId, variantId] = insightId.split("-");

      if (!productInsights) return;

      const insight = productInsights.find(
        (item) => `${item.productId}-${item.variantId}` === insightId,
      );

      hideInsightMutation.mutate({
        productId,
        variantId,
        insightTitle: insight?.productTitle,
      });
    },
    [productInsights, hideInsightMutation],
  );

  return (
    <Section
      title={
        <InlineStack gap="400" align="start" blockAlign="center">
          <Text as="h2" variant="headingLg">
            {title}
          </Text>
          <div style={{ transform: "translateY(-1px)" }}>
            <Text as="span" variant="bodySm" tone="subdued">
              {todayString}
            </Text>
          </div>
          <InlineStack gap="300" align="start" blockAlign="center">
            <Tooltip
              content="Sets the lookback window used to calculate sales-based insight metrics."
              dismissOnMouseOut
            >
              <div style={{ transform: "translateY(-1px)" }}>
                <Text as="span" variant="bodySm" tone="subdued">
                  Sales analysis:
                </Text>
              </div>
            </Tooltip>
            <ButtonGroup variant="segmented">
              {SALES_PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  pressed={historyDays === option.value}
                  onClick={() => setHistoryDays(option.value)}
                  size="slim"
                >
                  {option.label === "Last month"
                    ? "30 Days"
                    : option.label === "Last 3 months"
                      ? "90 Days"
                      : "14 Days"}
                </Button>
              ))}
            </ButtonGroup>
          </InlineStack>
        </InlineStack>
      }
      defaultActionText={{
        show: "View Insights",
        collapse: "Collapse Insights",
      }}
    >
      <CollapsibleCard
        isLoading={isFetching}
        isEmpty={productInsights?.length === 0}
        loadingText="Loading insights..."
        emptyStateMessage="No insights needed today!"
        emptyStateDescription="Your inventory is well-managed and balanced. No action required at this time 🌟"
      >
        {productInsights && productInsights.length > 0 && (
          <InsightCardList
            insights={productInsights || []}
            onHideInsight={handleHideInsight}
          />
        )}
      </CollapsibleCard>
    </Section>
  );
}

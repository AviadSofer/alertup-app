import { Text } from "@shopify/polaris";
import type { ProductInsight } from "../models/product-insights.server";
import { InsightType } from "../services/analysis/product-insights.service";
import { EMPTY_VARIANT_TITLE } from "app/constants";
import { isToday } from "app/lib/code-utils";

interface InsightMessageProps {
  insight: ProductInsight;
  insightLog?: {
    firstDetectedAt: Date;
  } | null;
}

const getIcon = (type: InsightType) => {
  switch (type) {
    case InsightType.CRITICAL_STOCKOUT:
      return "⚠️";
    case InsightType.STANDARD_REORDER:
      return "🛒";
    case InsightType.PLAN_AHEAD:
      return "📅";
    default:
      return "";
  }
};

export const InsightMessage = ({
  insight,
  insightLog,
}: InsightMessageProps) => {
  const icon = getIcon(insight.insightType);
  const productName = (
    <Text variant="headingMd" as="span">
      {insight.productTitle}
      {insight.variantTitle && insight.variantTitle !== EMPTY_VARIANT_TITLE
        ? ` - ${insight.variantTitle}`
        : ""}
    </Text>
  );

  // Format the detection date if available
  let detectionText = null;
  if (insightLog?.firstDetectedAt) {
    const detectionDate = new Date(insightLog.firstDetectedAt);
    detectionText = isToday(detectionDate)
      ? "Today or time of installation"
      : detectionDate.toLocaleDateString();
  }

  switch (insight.insightType) {
    case InsightType.CRITICAL_STOCKOUT:
      return (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
          }}
        >
          <span
            style={{ fontSize: "1.2em", display: "flex", alignItems: "center" }}
          >
            {icon}
          </span>
          <span>
            {insight.recommendedReorderQuantity === 0 ? (
              <>
                Out of Stock: {productName} is out of stock. No sales data
                available.
                {detectionText && (
                  <Text variant="bodySm" as="span" tone="subdued">
                    {" "}
                    (Out of stock since: {detectionText})
                  </Text>
                )}
              </>
            ) : (
              <>
                Out of Stock: {productName} is out of stock. Order{" "}
                {insight.recommendedReorderQuantity} units now.
                {detectionText && (
                  <Text variant="bodySm" as="span" tone="subdued">
                    {" "}
                    (Out of stock since: {detectionText})
                  </Text>
                )}
              </>
            )}
          </span>
        </p>
      );
    case InsightType.STANDARD_REORDER:
      return (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
          }}
        >
          <span
            style={{ fontSize: "1.2em", display: "flex", alignItems: "center" }}
          >
            {icon}
          </span>
          <span>
            Reorder: {productName} will run out in {insight.daysUntilStockout}{" "}
            days. Order {insight.recommendedReorderQuantity} units.
          </span>
        </p>
      );
    case InsightType.PLAN_AHEAD:
      return (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
          }}
        >
          <span
            style={{ fontSize: "1.2em", display: "flex", alignItems: "center" }}
          >
            {icon}
          </span>
          <span>
            Plan Ahead: {productName} will run out in{" "}
            {insight.daysUntilStockout} days. Plan to order{" "}
            {insight.recommendedReorderQuantity} units.
          </span>
        </p>
      );
    default:
      return <p style={{ margin: 0 }}>{insight.message || "No message"}</p>;
  }
};

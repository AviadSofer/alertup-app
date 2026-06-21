import { useState } from "react";
import type { ProductInsight } from "../models/product-insights.server";
import { InsightCardPreview } from "./InsightCardPreview";
import { Button } from "@shopify/polaris";

const DEFAULT_DISPLAY_COUNT = 4;

interface InsightCardListProps {
  insights: ProductInsight[];
  onHideInsight?: (insightId: string) => void;
}

export const InsightCardList = ({
  insights,
  onHideInsight,
}: InsightCardListProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayedInsights = showAll
    ? insights
    : insights.slice(0, DEFAULT_DISPLAY_COUNT);
  const hasMore = insights.length > DEFAULT_DISPLAY_COUNT;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {displayedInsights.map((insight, index) => (
        <InsightCardPreview
          key={`${insight.productId}-${insight.variantId}-${index}`}
          insight={insight}
          onHideInsight={onHideInsight}
        />
      ))}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="monochromePlain"
            textAlign="center"
          >
            {showAll ? "Show less" : `Show all insights (${insights.length})`}
          </Button>
        </div>
      )}
    </div>
  );
};

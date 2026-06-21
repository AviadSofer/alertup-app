import { Banner } from "@shopify/polaris";
import { useCallback } from "react";
import type { ProductInsight } from "../models/product-insights.server";
import { InsightType } from "../services/analysis/product-insights.service";
import { InsightMessage } from "./InsightMessage";
import { InsightActionsPopover } from "./InsightActionsPopover";

interface InsightCardPreviewProps {
  insight: ProductInsight;
  onHideInsight?: (insightId: string) => void;
}

export const InsightCardPreview = ({
  insight,
  onHideInsight,
}: InsightCardPreviewProps) => {
  const handleHideInsight = useCallback(() => {
    if (onHideInsight) {
      onHideInsight(`${insight.productId}-${insight.variantId}`);
    }
  }, [insight.productId, insight.variantId, onHideInsight]);

  const getBannerTone = (type: InsightType) => {
    switch (type) {
      case InsightType.CRITICAL_STOCKOUT:
        return "critical";
      case InsightType.STANDARD_REORDER:
        return "info";
      case InsightType.PLAN_AHEAD:
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <Banner tone={getBannerTone(insight.insightType)} hideIcon>
        <InsightMessage insight={insight} insightLog={insight.insightLog} />
      </Banner>

      <div
        style={{
          position: "absolute",
          zIndex: 1,
          top: "60%",
          transform: "translateY(-50%)",
          right: 0,
        }}
      >
        <InsightActionsPopover onHideInsight={handleHideInsight} />
      </div>
    </div>
  );
};

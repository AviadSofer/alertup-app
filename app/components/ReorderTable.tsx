import type { ReorderProduct } from "../models/reorder-analysis.server";
import { DataTableCard } from "./DataTableCard";
import { Section } from "./Section";
import { Badge } from "@shopify/polaris";

interface ReorderTableProps {
  reorderData: ReorderProduct[];
  isLoading?: boolean;
}

const getStatusBadge = (status: ReorderProduct["status"]) => {
  switch (status) {
    case "out-of-stock":
      return <Badge tone="critical">Out of Stock</Badge>;
    case "running-low":
      return <Badge tone="warning">Running Low</Badge>;
    case "healthy":
      return <Badge tone="success">Healthy</Badge>;
    case "overstocked":
      return <Badge tone="info">Overstocked</Badge>;
    case "no-sales":
      return <Badge tone="attention">No Sales</Badge>;
    default:
      return null;
  }
};

export function ReorderTable({ reorderData, isLoading }: ReorderTableProps) {
  const reorderRows = reorderData.map((product) => [
    product.featuredImage?.url,
    product.title,
    product.variantTitle,
    getStatusBadge(product.status),
    product.noSalesData
      ? "⚠️ No sales data available"
      : product.recommendedReorderQuantity.toString(),
  ]);

  return (
    <Section
      title="Products to Reorder"
      defaultActionText={{
        show: "View Reorder List",
        collapse: "Collapse Reorder List",
      }}
    >
      <DataTableCard
        isLoading={isLoading}
        columnContentTypes={["text", "text", "text", "text", "text"]}
        headings={[
          "",
          "🛒 Product",
          "🗂 Variant",
          "📊 Status",
          "✅ Recommended Reorder",
        ]}
        rows={reorderRows}
        variantColumnIndex={2}
        titleColumnIndex={1}
        imageColumnIndex={0}
        emptyStateMessage="No reorders needed!"
        emptyStateDescription="Your inventory levels are perfectly balanced. Great job! 🌟"
        tableName="reorder-list"
      />
    </Section>
  );
}

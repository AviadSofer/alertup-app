import type { ProductInventory } from "../models/inventory-analysis.server";
import { DataTableCard } from "./DataTableCard";
import { Section } from "./Section";
import { Text } from "@shopify/polaris";
import { getInventoryCriteria } from "../services/analysis/inventory-categorization.service";
import { formatNumberWithCommas } from "../lib/code-utils";

interface InventoryAnalysisTableProps {
  productInventoryAnalysis: ProductInventory[];
  isLoading?: boolean;
  inventoryDaysForStatus?: number;
}

const getStockoutDisplay = (
  product: ProductInventory,
  inventoryDaysForStatus?: number,
) => {
  const criteria = getInventoryCriteria(inventoryDaysForStatus);
  if (product.currentInventory === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ color: "#D82C0D" }}>●</span>
        <Text as="span" variant="bodySm">
          Out of Stock
        </Text>
      </div>
    );
  }

  if (product.dailyRate === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ color: "#008060" }}>●</span>
        <Text as="span" variant="bodySm">
          No Stockout Risk
        </Text>
      </div>
    );
  }

  if (product.daysUntilStockout === "∞") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ color: "#008060" }}>●</span>
        <Text as="span" variant="bodySm">
          No Stockout
        </Text>
      </div>
    );
  }

  let dotColor = "#008060"; // green
  if (
    criteria.isRunningLow({
      currentInventory: product.currentInventory,
      dailyRate: product.dailyRate,
    })
  ) {
    dotColor = "#FFA400"; // orange
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span style={{ color: dotColor }}>●</span>
      <Text as="span" variant="bodySm">
        {formatNumberWithCommas(product.daysUntilStockout)} days
      </Text>
    </div>
  );
};

export function InventoryAnalysisTable({
  productInventoryAnalysis,
  isLoading,
  inventoryDaysForStatus,
}: InventoryAnalysisTableProps) {
  const productInventoryAnalysisRows = productInventoryAnalysis.map(
    (product: ProductInventory) => [
      product.featuredImage?.url,
      product.title,
      product.variantTitle,
      formatNumberWithCommas(product.totalSalesQuantity),
      formatNumberWithCommas(product.currentInventory),
      (Math.trunc(product.dailyRate * 100) / 100).toFixed(2),
      getStockoutDisplay(product, inventoryDaysForStatus),
      product.status,
    ],
  );

  return (
    <Section
      title="Inventory Analysis"
      defaultActionText={{
        show: "View Inventory Analysis",
        collapse: "Collapse Inventory Analysis",
      }}
    >
      <DataTableCard
        isLoading={isLoading}
        columnContentTypes={[
          "text",
          "text",
          "text",
          "numeric",
          "numeric",
          "numeric",
          "text",
          "text",
        ]}
        headings={[
          "",
          "🛒 Product",
          "🗂 Variant",
          "💰 Total Sold",
          "📅 Current Inventory",
          "📈 Daily Rate",
          "📝 Days Until Stockout",
          "Product Status",
        ]}
        rows={productInventoryAnalysisRows}
        variantColumnIndex={2}
        titleColumnIndex={1}
        imageColumnIndex={0}
        emptyStateMessage="Your inventory is looking great!"
        emptyStateDescription="All your products are well-stocked and under control. Keep up the good work! 🎉"
        showFilters={true}
        tableName="inventory-analysis"
        productStatusColumnIndex={7}
        inventoryDaysForStatus={inventoryDaysForStatus}
      />
    </Section>
  );
}

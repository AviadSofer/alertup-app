import { Button } from "@shopify/polaris";
import { DataTableCard } from "./DataTableCard";
import type { ColumnContentType } from "@shopify/polaris";

export interface HiddenProduct {
  id: string;
  productId: string;
  variantId: string | null;
  hiddenAt: string;
  productTitle: string;
  variantTitle: string;
  imageUrl?: string;
  [key: string]: unknown;
}

interface HiddenProductsTableProps {
  hiddenProducts: HiddenProduct[];
  onDelete: (productId: string, variantId: string | null) => void;
}

export function HiddenProductsTable({
  hiddenProducts,
  onDelete,
}: HiddenProductsTableProps) {
  const rows = hiddenProducts.map((product) => [
    product.imageUrl,
    product.productTitle,
    product.variantTitle || "All Variants",
    new Date(product.hiddenAt).toLocaleDateString(),
    <Button
      key={product.id}
      tone="critical"
      onClick={() => onDelete(product.productId, product.variantId)}
      size="slim"
    >
      Unhide
    </Button>,
  ]);

  const columnContentTypes: ColumnContentType[] = [
    "text",
    "text",
    "text",
    "text",
    "text",
  ];

  const headings = ["", "Product", "Variant", "Hidden On", "Actions"];

  return (
    <DataTableCard
      columnContentTypes={columnContentTypes}
      headings={headings}
      rows={rows}
      tableName="hidden-products"
      variantColumnIndex={2}
      titleColumnIndex={1}
      imageColumnIndex={0}
      emptyStateMessage="No hidden products"
      emptyStateDescription="When you hide products, they will appear here."
    />
  );
}

import {
  Text,
  Box,
  BlockStack,
  Badge,
  Thumbnail,
  Icon,
} from "@shopify/polaris";
import type { IconSource } from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import type { ProductInventory } from "../services/analysis/analysis-product-inventory.service";
import type { ReactNode } from "react";
import { StatusInfo } from "./StatusInfo";

interface StatusBoxProps {
  title: string;
  count: number;
  percentage: number;
  icon: IconSource;
  products: ProductInventory[];
  tone: "success" | "warning" | "critical" | "info";
  showBorder?: boolean;
  infoTooltip?: ReactNode;
}

export function StatusBox({
  title,
  count,
  percentage,
  icon,
  products,
  tone,
  showBorder = false,
  infoTooltip,
}: StatusBoxProps) {
  const formattedPercentage = Number.isNaN(percentage)
    ? 0
    : Math.round(percentage);
  const hasProducts = products.some((p) => p.featuredImage);

  return (
    <Box
      padding="300"
      position="relative"
      minHeight="140px"
      borderInlineEndWidth={showBorder ? "025" : "0"}
      borderColor={showBorder ? "border-secondary" : undefined}
      background="bg-surface"
      shadow="100"
      borderRadius="200"
    >
      <BlockStack gap="200">
        <BlockStack>
          <Badge tone={tone} icon={icon}>
            {title}
          </Badge>

          <div
            style={{
              position: "absolute",
              zIndex: 1,
              top: "10px",
              right: "15px",
            }}
          >
            {infoTooltip && <StatusInfo content={infoTooltip} />}
          </div>
        </BlockStack>

        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <Text as="span" variant="headingLg" fontWeight="bold">
            {count}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            {formattedPercentage}%
          </Text>
        </div>

        <div
          style={{
            position: "relative",
            height: "40px",
            marginTop: "auto",
          }}
        >
          {hasProducts ? (
            <div style={{ position: "relative", height: "100%" }}>
              {products.slice(0, 4).map(
                (product, index) =>
                  product.featuredImage && (
                    <div
                      key={index}
                      style={{
                        position: "absolute",
                        left: `${index * 28}px`,
                        zIndex: 5 - index,
                        background: "var(--p-color-bg-surface)",
                        padding: "2px",
                        borderRadius: "6px",
                        border: "1px solid var(--p-color-border)",
                        transition: "transform 0.2s ease",
                        transform: `rotate(${index % 2 === 0 ? "-2" : "2"}deg)`,
                      }}
                    >
                      <Thumbnail
                        source={product.featuredImage.url}
                        alt={
                          product.featuredImage.altText ||
                          `Product ${index + 1}`
                        }
                        size="small"
                      />
                    </div>
                  ),
              )}
              {products.length > 4 && (
                <div
                  style={{
                    position: "absolute",
                    left: `${4 * 28 + 8}px`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "var(--p-color-bg-surface-secondary)",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  <Text as="span" variant="bodySm" tone="subdued">
                    +{products.length - 4}
                  </Text>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                color: "var(--p-color-text-subdued)",
                cursor: "default",
                background: "var(--p-color-bg-surface-secondary)",
                borderRadius: "8px",
                padding: "4px 12px",
                transition: "all 0.2s ease",
              }}
            >
              <Icon source={ImageIcon} tone="subdued" />
              <Text as="span" variant="bodyXs" tone="subdued">
                No products here
              </Text>
            </div>
          )}
        </div>
      </BlockStack>
    </Box>
  );
}

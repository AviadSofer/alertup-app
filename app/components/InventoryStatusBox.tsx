import { Grid } from "@shopify/polaris";
import {
  AlertTriangleIcon,
  XIcon,
  AlertCircleIcon,
  InfoIcon,
  CheckIcon,
} from "@shopify/polaris-icons";
import type { InventoryStatus } from "../services/analysis/inventory-status.service";
import { StatusBox } from "./StatusBox";
import { Section } from "./Section";
import { MINIMUM_INVENTORY_DAYS } from "../constants";

interface InventoryStatusBoxProps {
  status: InventoryStatus;
}

export function InventoryStatusBox({ status }: InventoryStatusBoxProps) {
  return (
    <Section
      title="Inventory Status"
      defaultActionText={{
        show: "View Inventory Status",
        collapse: "Collapse Inventory Status",
      }}
    >
      <Grid columns={{ xs: 1, sm: 2, md: 5, lg: 5, xl: 5 }}>
        <Grid.Cell>
          <StatusBox
            title="Running low"
            count={status.runningLow.count}
            percentage={status.runningLow.percentage}
            icon={AlertTriangleIcon}
            products={status.runningLow.products}
            tone="warning"
            showBorder
            infoTooltip={`Inventory that will last less than ${MINIMUM_INVENTORY_DAYS} days based on current daily sales rate`}
          />
        </Grid.Cell>
        <Grid.Cell>
          <StatusBox
            title="Out of stock"
            count={status.outOfStock.count}
            percentage={status.outOfStock.percentage}
            icon={XIcon}
            products={status.outOfStock.products}
            tone="critical"
            showBorder
            infoTooltip="Products with zero inventory available"
          />
        </Grid.Cell>
        <Grid.Cell>
          <StatusBox
            title="No sales"
            count={status.noSales.count}
            percentage={status.noSales.percentage}
            icon={AlertCircleIcon}
            products={status.noSales.products}
            tone="warning"
            showBorder
            infoTooltip="Products with inventory but no recent sales"
          />
        </Grid.Cell>
        <Grid.Cell>
          <StatusBox
            title="Overstocked"
            count={status.overstocked.count}
            percentage={status.overstocked.percentage}
            icon={InfoIcon}
            products={status.overstocked.products}
            tone="info"
            showBorder
            infoTooltip={`Inventory that exceeds 1.5x the recommended level based on ${MINIMUM_INVENTORY_DAYS} days of sales`}
          />
        </Grid.Cell>
        <Grid.Cell>
          <StatusBox
            title="Healthy"
            count={status.healthy.count}
            percentage={status.healthy.percentage}
            icon={CheckIcon}
            products={status.healthy.products}
            tone="success"
            infoTooltip="Products with balanced inventory, between reorder point and 1.5x the recommended level"
          />
        </Grid.Cell>
      </Grid>
    </Section>
  );
}

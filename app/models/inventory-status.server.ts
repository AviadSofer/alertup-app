import type { InventoryStatus } from "../services/analysis/inventory-status.service";
import { analyzeInventoryStatus } from "../services/analysis/inventory-status.service";
import type { ProductInventory } from "./inventory-analysis.server";

export type { InventoryStatus };

export function getInventoryStatus(
  productInventoryAnalysis: ProductInventory[],
): InventoryStatus {
  return analyzeInventoryStatus(productInventoryAnalysis);
}

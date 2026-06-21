import {
  MINIMUM_INVENTORY_DAYS,
  STOCK_THRESHOLDS,
  ALERT_COLORS,
} from "../../constants";
import { sendStockAlertEmail } from "../resend/resend.service";
import { generateAppLink, calculateDaysLeft } from "../../lib/code-utils";
import { updateInventoryLevelQuantity } from "../db/inventory-level.service";
import type { InventoryItem } from "./inventory-categorization.service";
import { inventoryCriteria } from "./inventory-categorization.service";

enum InventoryStatus {
  OUT_OF_STOCK = "outOfStock",
  RUNNING_LOW = "runningLow",
  HEALTHY = "healthy",
  OVERSTOCKED = "overstocked",
  NO_SALES = "noSales",
}

interface InventoryUpdate {
  inventoryItemId: string;
  locationId: string;
  newAvailableQuantity: number;
  previousInventoryData: InventoryLevelData;
  shopDomain: string;
  productName?: string;
  skipEmailAlerts: boolean;
}

interface InventoryLevelData {
  id: string;
  availableQuantity: number;
  shop: {
    id: string;
    email?: string;
    contactEmail: string;
    receiveStockAlertEmails: boolean;
  };
}

interface AlertDetails {
  stockStatusDescription: string;
  recommendation: string;
  daysLeft: number;
  backgroundColor: string;
  isRunningLow: boolean;
}

function shouldSendInventoryAlert(
  previousQuantity: number,
  newQuantity: number,
  dailySaleRate: number = 1,
): boolean {
  // If no change, no need for an alert
  if (previousQuantity === newQuantity) {
    return false;
  }

  // Function to determine inventory severity level:
  // 0 - Normal (healthy) level
  // 1 - Running low but still has inventory
  // 2 - Out of stock (zero)
  const getSeverityLevel = (quantity: number, daysLeft: number) => {
    if (quantity === STOCK_THRESHOLDS.OUT_OF_STOCK) {
      return 2; // Out of stock
    }
    if (daysLeft < MINIMUM_INVENTORY_DAYS) {
      return 1; // Running low
    }
    return 0; // Healthy
  };

  // Calculate days of inventory for both quantities
  const previousDaysLeft = calculateDaysLeft(previousQuantity, dailySaleRate);
  const newDaysLeft = calculateDaysLeft(newQuantity, dailySaleRate);

  // Determine severity levels
  const previousLevel = getSeverityLevel(previousQuantity, previousDaysLeft);
  const newLevel = getSeverityLevel(newQuantity, newDaysLeft);

  // Send alert only if:
  // 1. Severity level increased (situation got worse)
  // 2. We crossed to a more severe level (e.g., from healthy to low, or from low to out of stock)
  return newLevel > previousLevel;
}

function analyzeInventoryStatus(
  newQuantity: number,
  dailySaleRate: number = 1,
): AlertDetails {
  // Create inventory item object for status calculation
  const item: InventoryItem = {
    currentInventory: newQuantity,
    dailyRate: dailySaleRate,
  };

  // Determine inventory status directly using criteria functions
  let inventoryStatus: InventoryStatus;
  let isRunningLow = false;

  if (inventoryCriteria.isOutOfStock(item)) {
    inventoryStatus = InventoryStatus.OUT_OF_STOCK;
    isRunningLow = true;
  } else if (inventoryCriteria.isRunningLow(item)) {
    inventoryStatus = InventoryStatus.RUNNING_LOW;
    isRunningLow = true;
  } else if (inventoryCriteria.isNoSales(item)) {
    inventoryStatus = InventoryStatus.NO_SALES;
  } else if (inventoryCriteria.isOverstocked(item)) {
    inventoryStatus = InventoryStatus.OVERSTOCKED;
  } else {
    inventoryStatus = InventoryStatus.HEALTHY;
  }

  // Calculate days remaining in stock
  const daysLeft = calculateDaysLeft(newQuantity, dailySaleRate);

  // Create recommendation based on inventory status
  let recommendation = "";
  let stockStatusDescription = "";

  if (inventoryStatus === InventoryStatus.OUT_OF_STOCK) {
    recommendation = "It is recommended to order inventory urgently!";
    stockStatusDescription = "Out of Stock";
  } else if (inventoryStatus === InventoryStatus.RUNNING_LOW) {
    recommendation = `It is recommended to order inventory before it runs out. About ${daysLeft} days remaining.`;
    stockStatusDescription = "Low Stock";
  } else if (inventoryStatus === InventoryStatus.HEALTHY) {
    recommendation = "Inventory level is normal.";
    stockStatusDescription = "Healthy Stock";
  } else if (inventoryStatus === InventoryStatus.OVERSTOCKED) {
    recommendation = "There is excess inventory. Consider promotional sales.";
    stockStatusDescription = "Overstocked";
  } else {
    recommendation = "No recent sales. Check product performance.";
    stockStatusDescription = "No Recent Sales";
  }

  // Set background color according to inventory status
  let backgroundColor = ALERT_COLORS.HEALTHY; // Default green
  if (
    daysLeft < STOCK_THRESHOLDS.VERY_LOW_DAYS ||
    newQuantity === STOCK_THRESHOLDS.OUT_OF_STOCK
  ) {
    backgroundColor = ALERT_COLORS.CRITICAL; // Red for very low or out of stock
  } else if (daysLeft < MINIMUM_INVENTORY_DAYS) {
    backgroundColor = ALERT_COLORS.WARNING; // Orange for low stock
  }

  return {
    stockStatusDescription,
    recommendation,
    daysLeft,
    backgroundColor,
    isRunningLow,
  };
}

async function sendInventoryAlert(
  update: InventoryUpdate,
  alertDetails: AlertDetails,
): Promise<void> {
  const {
    shopDomain,
    productName,
    previousInventoryData,
    newAvailableQuantity,
  } = update;

  // Create link to product dashboard
  const productDashboardLink = generateAppLink(shopDomain);

  // Send email alert
  await sendStockAlertEmail({
    to: [
      {
        email:
          previousInventoryData.shop.email ||
          previousInventoryData.shop.contactEmail,
      },
    ],
    shopDomain,
    productName:
      productName || `Product ${update.inventoryItemId.split("/").pop()}`,
    headline: `Inventory Update for ${productName}`,
    stockStatusDescription: alertDetails.stockStatusDescription,
    currentStock: newAvailableQuantity,
    daysLeft: alertDetails.daysLeft,
    recommendation: alertDetails.recommendation,
    productDashboardLink,
    backgroundColor: alertDetails.backgroundColor,
  });
}

export async function processInventoryUpdate(
  update: InventoryUpdate,
): Promise<string> {
  const { newAvailableQuantity, previousInventoryData, skipEmailAlerts } =
    update;

  // Get previous quantity
  const previousQuantity = previousInventoryData.availableQuantity;

  // Analyze inventory status for new quantity
  const alertDetails = analyzeInventoryStatus(newAvailableQuantity);

  // Check if the change warrants an alert
  const shouldAlert = shouldSendInventoryAlert(
    previousQuantity,
    newAvailableQuantity,
  );

  if (shouldAlert && !skipEmailAlerts) {
    // Send email alert
    await sendInventoryAlert(update, alertDetails);
  }

  // Update inventory in our database
  await updateInventoryLevelQuantity(
    previousInventoryData.id,
    newAvailableQuantity,
  );

  if (skipEmailAlerts && shouldAlert) {
    return "No alert sent (email notifications disabled)";
  }

  return shouldAlert ? "Alert sent successfully" : "No alert needed";
}

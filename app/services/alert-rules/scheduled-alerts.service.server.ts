import type { AlertRule, AlertRecipient } from "@prisma/client";
import db from "../../db.server";
import type { InventoryItem } from "../graphql/get-inventory-levels";
import { getInventoryLevels } from "../graphql/get-inventory-levels";

interface ScheduledRule extends AlertRule {
  recipients: AlertRecipient[];
}

export interface ScheduledAlertItem {
  productTitle: string;
  variantTitle?: string | null;
  sku?: string | null;
  currentStock: number;
  threshold: number;
  reorderQty?: number | null;
}

export interface SendScheduledAlertDigestInput {
  to: Array<{
    email: string;
    name?: string;
  }>;
  shopDomain: string;
  ruleName: string;
  items: ScheduledAlertItem[];
}

export type SendScheduledAlertDigest = (
  input: SendScheduledAlertDigestInput,
) => Promise<unknown>;

export interface ProcessScheduledAlertsResult {
  shopsChecked: number;
  rulesChecked: number;
  emailsSent: number;
  alertLogsCreated: number;
  rulesSkippedWithoutSender: number;
}

function isRuleDue(rule: AlertRule, now: Date) {
  if (rule.deliveryMode !== "scheduled") return false;
  if (rule.schedule === "daily") return true;
  if (rule.schedule === "weekly") {
    return rule.scheduleDayOfWeek === now.getDay();
  }

  return false;
}

function getAvailableQuantity(item: InventoryItem, locationId: string) {
  const level = item.inventoryLevels.edges.find(
    ({ node }) => node.location.id === locationId,
  );

  return (
    level?.node.quantities.find((quantity) => quantity.name === "available")
      ?.quantity ?? null
  );
}

function getInventoryLocations(item: InventoryItem, rule: AlertRule) {
  return item.inventoryLevels.edges
    .filter(({ node }) => !rule.locationId || node.location.id === rule.locationId)
    .map(({ node }) => ({
      locationId: node.location.id,
      availableQuantity: getAvailableQuantity(item, node.location.id),
    }))
    .filter(
      (location): location is { locationId: string; availableQuantity: number } =>
        location.availableQuantity !== null,
    );
}

function isItemInRuleScope(item: InventoryItem, rule: AlertRule) {
  const product = item.variant.product;

  switch (rule.scopeType) {
    case "all":
      return true;
    case "collection":
      return Boolean(
        rule.scopeValue &&
          product.collections.edges.some(
            ({ node }) => node.id === rule.scopeValue,
          ),
      );
    case "product":
      return product.id === rule.scopeValue;
    case "variant":
      return item.variant.id === rule.scopeValue;
    case "vendor":
      return (
        product.vendor.trim().toLowerCase() ===
        rule.scopeValue?.trim().toLowerCase()
      );
    default:
      return false;
  }
}

function toScheduledAlertItems(
  rule: AlertRule,
  inventoryItems: InventoryItem[],
) {
  const alertItems: ScheduledAlertItem[] = [];

  for (const item of inventoryItems) {
    if (!isItemInRuleScope(item, rule)) continue;

    const matchingLocations = getInventoryLocations(item, rule);

    for (const location of matchingLocations) {
      if (location.availableQuantity > rule.threshold) continue;

      alertItems.push({
        productTitle: item.variant.product.title,
        variantTitle: item.variant.title,
        sku: item.variant.sku,
        currentStock: location.availableQuantity,
        threshold: rule.threshold,
        reorderQty:
          rule.maxStockLevel === null
            ? null
            : Math.max(0, rule.maxStockLevel - location.availableQuantity),
      });
    }
  }

  return alertItems;
}

async function recordScheduledAlertLogs({
  shopId,
  rule,
  items,
}: {
  shopId: string;
  rule: ScheduledRule;
  items: ScheduledAlertItem[];
}) {
  const recipientEmails = rule.recipients
    .map((recipient) => recipient.email)
    .join(",");

  await db.$transaction([
    ...items.map((item) =>
      db.alertLog.create({
        data: {
          alertRuleId: rule.id,
          shopId,
          productTitle: item.productTitle,
          variantTitle: item.variantTitle ?? null,
          sku: item.sku ?? null,
          currentStock: item.currentStock,
          threshold: item.threshold,
          reorderQty: item.reorderQty ?? null,
          recipientEmails,
          deliveryMode: "scheduled",
        },
      }),
    ),
    db.alertRule.update({
      where: {
        id: rule.id,
      },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: {
          increment: items.length,
        },
      },
    }),
  ]);
}

export async function processScheduledAlerts(
  sendDigestEmail?: SendScheduledAlertDigest,
  now = new Date(),
): Promise<ProcessScheduledAlertsResult> {
  const result: ProcessScheduledAlertsResult = {
    shopsChecked: 0,
    rulesChecked: 0,
    emailsSent: 0,
    alertLogsCreated: 0,
    rulesSkippedWithoutSender: 0,
  };

  const shops = await db.shop.findMany({
    include: {
      alertRules: {
        where: {
          enabled: true,
          deliveryMode: "scheduled",
        },
        include: {
          recipients: true,
        },
      },
    },
  });

  result.shopsChecked = shops.length;

  for (const shop of shops) {
    const dueRules = shop.alertRules.filter((rule) => isRuleDue(rule, now));
    if (dueRules.length === 0) continue;

    const inventoryItems = await getInventoryLevels(undefined, {
      shopifyDomain: shop.shopifyDomain,
      accessToken: shop.accessToken,
    });

    for (const rule of dueRules) {
      result.rulesChecked++;

      if (rule.recipients.length === 0) continue;

      const alertItems = toScheduledAlertItems(rule, inventoryItems);
      if (alertItems.length === 0) continue;

      if (!sendDigestEmail) {
        result.rulesSkippedWithoutSender++;
        continue;
      }

      try {
        console.log(`Attempting to send scheduled alert for rule ${rule.id} to ${rule.recipients.length} recipients`);
        await sendDigestEmail({
          to: rule.recipients.map((recipient) => ({
            email: recipient.email,
          })),
          shopDomain: shop.shopifyDomain,
          ruleName: rule.name,
          items: alertItems,
        });

        console.log(`Successfully sent scheduled alert for rule ${rule.id}. Recording logs.`);
        await recordScheduledAlertLogs({
          shopId: shop.id,
          rule,
          items: alertItems,
        });

        result.emailsSent++;
        result.alertLogsCreated += alertItems.length;
      } catch (error) {
        console.error(`Failed to process scheduled alert rule ${rule.id} for shop ${shop.shopifyDomain}:`, error);
      }
    }
  }

  return result;
}

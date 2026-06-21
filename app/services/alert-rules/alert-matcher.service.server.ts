import type { AlertRecipient, AlertRule } from "@prisma/client";
import db from "../../db.server";

export interface InventoryEvent {
  shopId: string;
  inventoryItemId: string;
  locationId: string;
  productId: string;
  variantId?: string;
  collectionIds?: string[];
  vendor?: string;
  currentStock: number;
  previousStock: number;
}

export type AlertRuleWithRecipients = AlertRule & {
  recipients: AlertRecipient[];
};

export interface MatchedAlert {
  rule: AlertRuleWithRecipients;
  reorderQty: number | null;
}

interface RecipientMatch {
  match: MatchedAlert;
  specificity: number;
}

const scopeSpecificity: Record<string, number> = {
  all: 1,
  vendor: 2,
  collection: 3,
  product: 4,
  variant: 5,
};

export function shouldFireAlert(
  previousStock: number,
  currentStock: number,
  threshold: number,
) {
  return previousStock > threshold && currentStock <= threshold;
}

function isRuleLocationMatch(rule: AlertRule, locationId: string) {
  return !rule.locationId || rule.locationId === locationId;
}

function isRuleScopeMatch(rule: AlertRule, event: InventoryEvent) {
  if (rule.scopeType === "all") return true;
  
  if (!rule.scopeValue) return false;

  const selectedValues = rule.scopeValue.split(",").map(s => s.trim()).filter(Boolean);

  switch (rule.scopeType) {
    case "collection":
      return selectedValues.some((v) => event.collectionIds?.includes(v));
    case "product":
      return selectedValues.includes(event.productId);
    case "variant":
      return selectedValues.includes(event.variantId ?? "");
    case "vendor":
      return selectedValues.some(
        (v) => v.toLowerCase() === event.vendor?.trim().toLowerCase()
      );
    default:
      return false;
  }
}

function getReorderQty(rule: AlertRule, currentStock: number) {
  if (rule.maxStockLevel === null) return null;

  return Math.max(0, rule.maxStockLevel - currentStock);
}

function dedupeMatchesByRecipient(matches: MatchedAlert[]) {
  const bestMatchByRecipient = new Map<string, RecipientMatch>();

  for (const match of matches) {
    const specificity = scopeSpecificity[match.rule.scopeType] ?? 0;

    for (const recipient of match.rule.recipients) {
      const key = recipient.email.trim().toLowerCase();
      const existing = bestMatchByRecipient.get(key);

      if (!existing || specificity > existing.specificity) {
        bestMatchByRecipient.set(key, {
          match,
          specificity,
        });
      }
    }
  }

  const matchesByRule = new Map<string, MatchedAlert>();

  for (const [email, recipientMatch] of bestMatchByRecipient) {
    const { match } = recipientMatch;
    const existing = matchesByRule.get(match.rule.id);
    const recipient = match.rule.recipients.find(
      (candidate) => candidate.email.trim().toLowerCase() === email,
    );

    if (!recipient) continue;

    if (existing) {
      existing.rule.recipients.push(recipient);
      continue;
    }

    matchesByRule.set(match.rule.id, {
      reorderQty: match.reorderQty,
      rule: {
        ...match.rule,
        recipients: [recipient],
      },
    });
  }

  return Array.from(matchesByRule.values());
}

export async function findMatchingRules(
  event: InventoryEvent,
): Promise<MatchedAlert[]> {
  try {
    const rules = await db.alertRule.findMany({
      where: {
        shopId: event.shopId,
        enabled: true,
      },
      include: {
        recipients: true,
      },
    });

    const matches = rules
      .filter((rule) => rule.recipients.length > 0)
      .filter((rule) =>
        shouldFireAlert(event.previousStock, event.currentStock, rule.threshold),
      )
      .filter((rule) => isRuleLocationMatch(rule, event.locationId))
      .filter((rule) => isRuleScopeMatch(rule, event))
      .map((rule) => ({
        rule,
        reorderQty: getReorderQty(rule, event.currentStock),
      }));

    return dedupeMatchesByRecipient(matches);
  } catch (error) {
    console.error(
      `[findMatchingRules] Failed for inventory item ${event.inventoryItemId}:`,
      error,
    );
    throw new Error("Failed to match alert rules");
  }
}

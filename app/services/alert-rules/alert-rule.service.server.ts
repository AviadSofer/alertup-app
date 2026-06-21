import { Prisma } from "@prisma/client";

import db from "../../db.server";

export const DEFAULT_RULE_NAME = "Low stock - all products";
const LEGACY_DEFAULT_RULE_NAME = "Default Alert Rule";

export type AlertScopeType =
  | "all"
  | "collection"
  | "product"
  | "variant"
  | "vendor";

export type AlertDeliveryMode = "instant" | "scheduled";
export type AlertSchedule = "daily" | "weekly";

export interface AlertRecipientView {
  id: string;
  email: string;
}

export interface AlertRuleView {
  id: string;
  shopId: string;
  name: string;
  enabled: boolean;
  scopeType: AlertScopeType;
  scopeValue: string | null;
  scopeLabel: string | null;
  threshold: number;
  maxStockLevel: number | null;
  locationId: string | null;
  locationName: string | null;
  deliveryMode: AlertDeliveryMode;
  schedule: AlertSchedule | null;
  scheduleDayOfWeek: number | null;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
  recipientCount: number;
  recipients: AlertRecipientView[];
}

export interface AlertRuleInput {
  name: string;
  enabled?: boolean;
  scopeType: AlertScopeType;
  scopeValue?: string | null;
  scopeLabel?: string | null;
  threshold: number;
  maxStockLevel?: number | null;
  locationId?: string | null;
  locationName?: string | null;
  deliveryMode: AlertDeliveryMode;
  schedule?: AlertSchedule | null;
  scheduleDayOfWeek?: number | null;
  recipients: string[];
}

type AlertRuleWithRelations = Prisma.AlertRuleGetPayload<{
  include: {
    recipients: true;
    _count: {
      select: {
        recipients: true;
        alertLogs: true;
      };
    };
  };
}>;

export function isMissingAlertSchema(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2010" || error.code === "P2021" || error.code === "P2022")
  );
}

function normalizeRecipientEmails(recipients: string[]) {
  return Array.from(
    new Set(
      recipients
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    ),
  );
}

function mapRule(rule: AlertRuleWithRelations): AlertRuleView {
  return {
    id: rule.id,
    shopId: rule.shopId,
    name: rule.name,
    enabled: rule.enabled,
    scopeType: rule.scopeType as AlertScopeType,
    scopeValue: rule.scopeValue,
    scopeLabel: rule.scopeLabel,
    threshold: rule.threshold,
    maxStockLevel: rule.maxStockLevel,
    locationId: rule.locationId,
    locationName: rule.locationName,
    deliveryMode: rule.deliveryMode as AlertDeliveryMode,
    schedule: rule.schedule as AlertSchedule | null,
    scheduleDayOfWeek: rule.scheduleDayOfWeek,
    lastTriggeredAt: rule.lastTriggeredAt?.toISOString() ?? null,
    triggerCount: rule.triggerCount,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    recipientCount: rule._count.recipients,
    recipients: rule.recipients.map((recipient) => ({
      id: recipient.id,
      email: recipient.email,
    })),
  };
}

function isDefaultAllProductsRule(rule: {
  name: string;
  scopeType: string;
}) {
  return (
    rule.scopeType === "all" &&
    (rule.name === DEFAULT_RULE_NAME || rule.name === LEGACY_DEFAULT_RULE_NAME)
  );
}

function toRuleCreateData(
  shopId: string,
  data: AlertRuleInput,
): Prisma.AlertRuleCreateInput {
  return {
    shop: {
      connect: {
        id: shopId,
      },
    },
    name: data.name,
    enabled: data.enabled ?? true,
    scopeType: data.scopeType,
    scopeValue: data.scopeValue ?? null,
    scopeLabel: data.scopeLabel ?? null,
    threshold: data.threshold,
    maxStockLevel: data.maxStockLevel ?? null,
    locationId: data.locationId ?? null,
    locationName: data.locationName ?? null,
    deliveryMode: data.deliveryMode,
    schedule: data.schedule ?? null,
    scheduleDayOfWeek: data.scheduleDayOfWeek ?? null,
    recipients: {
      create: normalizeRecipientEmails(data.recipients).map((email) => ({
        email,
      })),
    },
  };
}

function toRuleUpdateData(data: Partial<AlertRuleInput>) {
  const updateData: Prisma.AlertRuleUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  if (data.scopeType !== undefined) updateData.scopeType = data.scopeType;
  if (data.scopeValue !== undefined) updateData.scopeValue = data.scopeValue;
  if (data.scopeLabel !== undefined) updateData.scopeLabel = data.scopeLabel;
  if (data.threshold !== undefined) updateData.threshold = data.threshold;
  if (data.maxStockLevel !== undefined) {
    updateData.maxStockLevel = data.maxStockLevel;
  }
  if (data.locationId !== undefined) updateData.locationId = data.locationId;
  if (data.locationName !== undefined) updateData.locationName = data.locationName;
  if (data.deliveryMode !== undefined) updateData.deliveryMode = data.deliveryMode;
  if (data.schedule !== undefined) updateData.schedule = data.schedule;
  if (data.scheduleDayOfWeek !== undefined) {
    updateData.scheduleDayOfWeek = data.scheduleDayOfWeek;
  }

  return updateData;
}

const ruleInclude = {
  recipients: true,
  _count: {
    select: {
      recipients: true,
      alertLogs: true,
    },
  },
} satisfies Prisma.AlertRuleInclude;

export async function getShopIdByDomain(shopDomain: string) {
  const shop = await db.shop.findUnique({
    where: { shopifyDomain: shopDomain },
    select: { id: true },
  });

  return shop?.id ?? null;
}

export async function createAlertRule(
  shopId: string,
  data: AlertRuleInput,
): Promise<AlertRuleView> {
  try {
    const rule = await db.alertRule.create({
      data: toRuleCreateData(shopId, data),
      include: ruleInclude,
    });

    return mapRule(rule);
  } catch (error) {
    console.error("[createAlertRule] Failed to create alert rule:", error);
    throw new Error("Failed to create alert rule");
  }
}

export async function updateAlertRule(
  ruleId: string,
  data: Partial<AlertRuleInput>,
): Promise<AlertRuleView> {
  try {
    return await db.$transaction(
      async (tx) => {
        const updatedRule = await tx.alertRule.update({
          where: {
            id: ruleId,
          },
          data: toRuleUpdateData(data),
        });

        if (data.recipients !== undefined) {
          const emails = normalizeRecipientEmails(data.recipients);

          await tx.alertRecipient.deleteMany({
            where: {
              alertRuleId: ruleId,
              email: {
                notIn: emails,
              },
            },
          });

          for (const email of emails) {
            await tx.alertRecipient.upsert({
              where: {
                alertRuleId_email: {
                  alertRuleId: ruleId,
                  email,
                },
              },
              update: {},
              create: {
                alertRuleId: ruleId,
                email,
              },
            });
          }
        }

        const rule = await tx.alertRule.findUniqueOrThrow({
          where: {
            id: updatedRule.id,
          },
          include: ruleInclude,
        });

        if (isDefaultAllProductsRule(rule)) {
          if (data.threshold !== undefined) {
            await tx.shop.update({
              where: { id: rule.shopId },
              data: { defaultThreshold: data.threshold },
            });
          }
        }

        return mapRule(rule);
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );
  } catch (error) {
    console.error(`[updateAlertRule] Failed for rule ${ruleId}:`, error);
    throw new Error("Failed to update alert rule");
  }
}

export async function deleteAlertRule(ruleId: string) {
  try {
    const deletedRule = await db.alertRule.delete({
      where: {
        id: ruleId,
      },
    });

    if (isDefaultAllProductsRule(deletedRule)) {
      await db.shop.update({
        where: { id: deletedRule.shopId },
        data: { defaultThreshold: null },
      });
    }

    return deletedRule;
  } catch (error) {
    console.error(`[deleteAlertRule] Failed for rule ${ruleId}:`, error);
    throw new Error("Failed to delete alert rule");
  }
}

export async function toggleAlertRule(
  ruleId: string,
  enabled: boolean,
): Promise<AlertRuleView> {
  try {
    const rule = await db.alertRule.update({
      where: {
        id: ruleId,
      },
      data: {
        enabled,
      },
      include: ruleInclude,
    });

    return mapRule(rule);
  } catch (error) {
    console.error(`[toggleAlertRule] Failed for rule ${ruleId}:`, error);
    throw new Error("Failed to toggle alert rule");
  }
}

export async function getAlertRulesForShop(
  shopId: string,
): Promise<AlertRuleView[]> {
  try {
    const rules = await db.alertRule.findMany({
      where: {
        shopId,
      },
      include: ruleInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return rules.map(mapRule);
  } catch (error) {
    if (isMissingAlertSchema(error)) return [];
    console.error(`[getAlertRulesForShop] Failed for shop ${shopId}:`, error);
    throw new Error("Failed to load alert rules");
  }
}

export async function getAlertRuleById(
  ruleId: string,
): Promise<AlertRuleView | null> {
  try {
    const rule = await db.alertRule.findUnique({
      where: {
        id: ruleId,
      },
      include: ruleInclude,
    });

    return rule ? mapRule(rule) : null;
  } catch (error) {
    if (isMissingAlertSchema(error)) return null;
    console.error(`[getAlertRuleById] Failed for rule ${ruleId}:`, error);
    throw new Error("Failed to load alert rule");
  }
}

export async function getStoreDefaultThreshold(shopId: string) {
  try {
    const shop = await db.shop.findUnique({
      where: {
        id: shopId,
      },
      select: {
        defaultThreshold: true,
      },
    });

    return shop?.defaultThreshold ?? null;
  } catch (error) {
    if (isMissingAlertSchema(error)) return null;
    console.error(
      `[getStoreDefaultThreshold] Failed for shop ${shopId}:`,
      error,
    );
    throw new Error("Failed to load store default threshold");
  }
}

export async function setStoreDefaultThreshold(
  shopId: string,
  threshold: number | null,
) {
  try {
    return await db.$transaction(async (tx) => {
      const shop = await tx.shop.update({
        where: {
          id: shopId,
        },
        data: {
          defaultThreshold: threshold,
        },
        select: {
          id: true,
          email: true,
          contactEmail: true,
        },
      });

      const existingRule = await tx.alertRule.findFirst({
        where: {
          shopId,
          scopeType: "all",
          name: {
            in: [DEFAULT_RULE_NAME, LEGACY_DEFAULT_RULE_NAME],
          },
        },
      });

      if (threshold !== null) {
        if (existingRule) {
          await tx.alertRule.update({
            where: { id: existingRule.id },
            data: {
              name: DEFAULT_RULE_NAME,
              threshold,
              enabled: true,
            },
          });
        } else {
          const recipientEmail = (shop.contactEmail || shop.email || "").trim();
          const recipientsData = recipientEmail
            ? { create: [{ email: recipientEmail.toLowerCase() }] }
            : undefined;

          await tx.alertRule.create({
            data: {
              shopId,
              name: DEFAULT_RULE_NAME,
              scopeType: "all",
              threshold,
              deliveryMode: "instant",
              enabled: true,
              recipients: recipientsData,
            },
          });
        }
      } else {
        if (existingRule) {
          await tx.alertRule.update({
            where: { id: existingRule.id },
            data: {
              enabled: false,
            },
          });
        }
      }

      return shop;
    });
  } catch (error) {
    console.error(
      `[setStoreDefaultThreshold] Failed for shop ${shopId}:`,
      error,
    );
    throw new Error("Failed to update store default threshold");
  }
}

export async function bulkToggleAlertRules(
  ruleIds: string[],
  enabled: boolean,
): Promise<void> {
  try {
    await db.alertRule.updateMany({
      where: {
        id: { in: ruleIds },
      },
      data: {
        enabled,
      },
    });
  } catch (error) {
    console.error(
      `[bulkToggleAlertRules] Failed for rules ${ruleIds.join(", ")}:`,
      error,
    );
    throw new Error("Failed to toggle alert rules in bulk");
  }
}

export async function bulkDeleteAlertRules(ruleIds: string[]): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      // Find rules that are default rules to update their shop's defaultThreshold
      const rulesToDelete = await tx.alertRule.findMany({
        where: {
          id: { in: ruleIds },
        },
        select: {
          id: true,
          name: true,
          scopeType: true,
          shopId: true,
        },
      });

      // Delete the rules
      await tx.alertRule.deleteMany({
        where: {
          id: { in: ruleIds },
        },
      });

      // Update shop default thresholds if any default rules were deleted
      const defaultRules = rulesToDelete.filter(
        (r) => isDefaultAllProductsRule(r),
      );
      for (const rule of defaultRules) {
        await tx.shop.update({
          where: { id: rule.shopId },
          data: { defaultThreshold: null },
        });
      }
    });
  } catch (error) {
    console.error(
      `[bulkDeleteAlertRules] Failed for rules ${ruleIds.join(", ")}:`,
      error,
    );
    throw new Error("Failed to delete alert rules in bulk");
  }
}

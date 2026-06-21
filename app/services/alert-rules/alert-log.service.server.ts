import type { Prisma } from "@prisma/client";

import db from "../../db.server";
import { isMissingAlertSchema } from "./alert-rule.service.server";

export interface CreateAlertLogInput {
  alertRuleId: string;
  shopId: string;
  productTitle: string;
  variantTitle?: string | null;
  sku?: string | null;
  currentStock: number;
  threshold: number;
  reorderQty?: number | null;
  recipientEmails: string[];
  deliveryMode: string;
}

export interface AlertLogView {
  id: string;
  alertRuleId: string;
  ruleName: string | null;
  shopId: string;
  productTitle: string;
  variantTitle: string | null;
  sku: string | null;
  currentStock: number;
  threshold: number;
  reorderQty: number | null;
  recipientEmails: string;
  deliveryMode: string;
  sentAt: string;
}

export interface AlertLogFilters {
  page?: number;
  limit?: number;
  ruleId?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export interface AlertStats {
  today: number;
  week: number;
  total: number;
}

type AlertLogWithRule = Prisma.AlertLogGetPayload<{
  include: {
    alertRule: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

function mapAlertLog(log: AlertLogWithRule): AlertLogView {
  return {
    id: log.id,
    alertRuleId: log.alertRuleId,
    ruleName: log.alertRule?.name ?? null,
    shopId: log.shopId,
    productTitle: log.productTitle,
    variantTitle: log.variantTitle,
    sku: log.sku,
    currentStock: log.currentStock,
    threshold: log.threshold,
    reorderQty: log.reorderQty,
    recipientEmails: log.recipientEmails,
    deliveryMode: log.deliveryMode,
    sentAt: log.sentAt.toISOString(),
  };
}

export async function createAlertLog(data: CreateAlertLogInput) {
  try {
    return await db.alertLog.create({
      data: {
        alertRuleId: data.alertRuleId,
        shopId: data.shopId,
        productTitle: data.productTitle,
        variantTitle: data.variantTitle ?? null,
        sku: data.sku ?? null,
        currentStock: data.currentStock,
        threshold: data.threshold,
        reorderQty: data.reorderQty ?? null,
        recipientEmails: data.recipientEmails.join(","),
        deliveryMode: data.deliveryMode,
      },
    });
  } catch (error) {
    console.error("[createAlertLog] Failed to create alert log:", error);
    throw new Error("Failed to create alert log");
  }
}

export async function getAlertLogsForShop(
  shopId: string,
  filters: AlertLogFilters = {},
) {
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
  const sentAt: Prisma.DateTimeFilter = {};

  if (filters.dateFrom) sentAt.gte = filters.dateFrom;
  if (filters.dateTo) sentAt.lte = filters.dateTo;

  const where: Prisma.AlertLogWhereInput = {
    shopId,
    ...(filters.ruleId ? { alertRuleId: filters.ruleId } : {}),
    ...(filters.dateFrom || filters.dateTo ? { sentAt } : {}),
  };

  try {
    const [logs, total] = await db.$transaction([
      db.alertLog.findMany({
        where,
        include: {
          alertRule: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          sentAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.alertLog.count({
        where,
      }),
    ]);

    return {
      logs: logs.map(mapAlertLog),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    if (isMissingAlertSchema(error)) {
      return {
        logs: [],
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    console.error(`[getAlertLogsForShop] Failed for shop ${shopId}:`, error);
    throw new Error("Failed to load alert logs");
  }
}

export async function getAlertStatsForShop(shopId: string): Promise<AlertStats> {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const [todayCount, weekCount, totalCount] = await db.$transaction([
      db.alertLog.count({
        where: {
          shopId,
          sentAt: {
            gte: today,
          },
        },
      }),
      db.alertLog.count({
        where: {
          shopId,
          sentAt: {
            gte: weekStart,
          },
        },
      }),
      db.alertLog.count({
        where: {
          shopId,
        },
      }),
    ]);

    return {
      today: todayCount,
      week: weekCount,
      total: totalCount,
    };
  } catch (error) {
    if (isMissingAlertSchema(error)) {
      return { today: 0, week: 0, total: 0 };
    }

    console.error(`[getAlertStatsForShop] Failed for shop ${shopId}:`, error);
    throw new Error("Failed to load alert stats");
  }
}

export async function getAlertStatsForRule(ruleId: string) {
  try {
    const [count, latestLog] = await db.$transaction([
      db.alertLog.count({
        where: {
          alertRuleId: ruleId,
        },
      }),
      db.alertLog.findFirst({
        where: {
          alertRuleId: ruleId,
        },
        orderBy: {
          sentAt: "desc",
        },
        select: {
          sentAt: true,
        },
      }),
    ]);

    return {
      count,
      lastTriggeredAt: latestLog?.sentAt ?? null,
    };
  } catch (error) {
    console.error(`[getAlertStatsForRule] Failed for rule ${ruleId}:`, error);
    throw new Error("Failed to load alert rule stats");
  }
}

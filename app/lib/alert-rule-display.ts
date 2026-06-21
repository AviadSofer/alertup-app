import type {
  AlertDeliveryMode,
  AlertRuleView,
  AlertSchedule,
  AlertScopeType,
} from "../services/alert-rules/alert-rule.service.server";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatRuleScope(
  scopeType: AlertScopeType,
  scopeLabel: string | null,
) {
  if (scopeType === "all") return "All products";
  return scopeLabel ?? scopeType.charAt(0).toUpperCase() + scopeType.slice(1);
}

export function formatRuleDelivery(
  mode: AlertDeliveryMode,
  schedule: AlertSchedule | null,
  dayOfWeek: number | null,
) {
  if (mode === "instant") return "Instant";
  if (schedule === "weekly") {
    return `Weekly (${WEEKDAYS[dayOfWeek ?? 0]})`;
  }
  return "Daily digest";
}

export function formatRelativeDate(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatRuleTriggered(rule: AlertRuleView) {
  if (!rule.lastTriggeredAt) return "Never triggered";
  return `Last triggered ${formatRelativeDate(rule.lastTriggeredAt)} · ${rule.triggerCount} total`;
}

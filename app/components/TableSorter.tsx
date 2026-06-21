import type { TableData } from "@shopify/polaris";

function getCellText(cell: unknown): string {
  if (typeof cell === "string" || typeof cell === "number") return `${cell}`;
  if (cell == null) return "";

  if (typeof cell === "object") {
    const maybeElement = cell as { props?: { children?: unknown } };
    const children = maybeElement.props?.children;
    if (children === undefined) return "";

    if (Array.isArray(children)) {
      return children.map(getCellText).join(" ");
    }
    return getCellText(children);
  }

  return "";
}

function parseSortableNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "∞") return Number.POSITIVE_INFINITY;
    const normalized = trimmed.replace(/,/g, "");

    if (/out of stock/i.test(normalized)) return 0;
    if (/no stockout/i.test(normalized) || /no stockout risk/i.test(normalized))
      return Number.POSITIVE_INFINITY;

    const match = normalized.match(/-?\d+(\.\d+)?/);
    if (!match) return Number.NaN;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  const text = getCellText(value);
  if (!text) return Number.NaN;
  return parseSortableNumber(text);
}

interface SortOptions {
  columnIndex: number;
  direction: "ascending" | "descending";
}

export function sortRows(
  rows: TableData[][],
  options: SortOptions,
): TableData[][] {
  const { columnIndex, direction } = options;

  return [...rows].sort((a, b) => {
    const aValue = a[columnIndex];
    const bValue = b[columnIndex];

    if (aValue === null || aValue === undefined)
      return direction === "ascending" ? 1 : -1;
    if (bValue === null || bValue === undefined)
      return direction === "ascending" ? -1 : 1;

    const aNum = parseSortableNumber(aValue);
    const bNum = parseSortableNumber(bValue);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return direction === "ascending" ? aNum - bNum : bNum - aNum;
    }

    return direction === "ascending"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });
}

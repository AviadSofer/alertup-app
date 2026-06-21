export function getTodayDateString() {
  const today = new Date();
  return today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumberWithCommas(num: number | string): string {
  let numberString = num.toString();
  const dotIndex = numberString.indexOf(".");
  if (dotIndex !== -1) {
    const integerPart = numberString.substring(0, dotIndex);
    const decimalPart = numberString.substring(dotIndex + 1, dotIndex + 3);
    numberString = `${integerPart}.${decimalPart}`;
  }
  const commas = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return commas;
}

export function parseNumberFromDisplayValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;

  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString();
};

export const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const getAppHandle = () => {
  if (process.env.SHOPIFY_APP_HANDLE) {
    return process.env.SHOPIFY_APP_HANDLE;
  }
  return process.env.NODE_ENV === "production"
    ? "stockup-9454"
    : "stockup-9455";
};

export const generateAppLink = (shopDomain: string) => {
  const appHandle = getAppHandle();
  return `https://admin.shopify.com/store/${shopDomain.split(".")[0]}/apps/${appHandle}`;
};

export const generateUnsubscribeLink = (shopDomain: string) => {
  const appHandle = getAppHandle();
  return `https://admin.shopify.com/store/${shopDomain.split(".")[0]}/apps/${appHandle}/unsubscribe`;
};

export const generatePricingLink = (shopDomain: string) => {
  const appHandle = getAppHandle();
  return `https://admin.shopify.com/store/${shopDomain.split(".")[0]}/charges/${appHandle}/pricing_plans`;
};

export function calculateDaysLeft(
  quantity: number,
  dailyRate: number = 1,
): number {
  return quantity === 0 ? 0 : Math.floor(quantity / dailyRate);
}

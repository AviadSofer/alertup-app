export const SALES_ANALYSIS_PERIOD_DAYS = 30;
export const MINIMUM_INVENTORY_DAYS = 14;
export const DAILY_RATE_CAP_MULTIPLIER = 5;
export const IS_USE_DAILY_RATE_CAP = false;

export const REORDER_PERIOD_OPTIONS = [
  { label: "14 Days", value: "14" },
  { label: "30 Days (1 Month)", value: "30" },
  { label: "60 Days (2 Months)", value: "60" },
  { label: "90 Days (3 Months)", value: "90" },
];

export const SALES_PERIOD_OPTIONS = [
  { label: "Last 14 days", value: "14" },
  { label: "Last month", value: "30" },
  { label: "Last 3 months", value: "90" },
];

export const INVENTORY_THRESHOLDS = {
  GRADE_A_LOW_DAILY_RATE: 10,
  OUT_OF_STOCK_THRESHOLD: 0,
} as const;

export const STOCK_THRESHOLDS = {
  VERY_LOW_DAYS: 7,
  OUT_OF_STOCK: 0,
} as const;

export const ALERT_COLORS = {
  HEALTHY: "#4CAF50",
  WARNING: "#FF9800",
  CRITICAL: "#F44336",
};

export const EMPTY_VARIANT_TITLE = "Default Title";

export const PRICING_PLANS = {
  FREE_TRIAL: {
    PRICE: 0,
    DURATION: 7,
  },
  BASIC: {
    PRICE: 12,
    DURATION: 30,
  },
};

export const POSTHOG_API_KEY =
  "phc_TXBOj60t3YEDdAbNDKySm1CFyHwt7SCWoQHn9wRZj8m";
export const POSTHOG_API_HOST = "https://us.i.posthog.com";


export const RESEND_API_KEY ="re_Anv4BzUi_AzChY7C59pHPfAyjzMrX9gdt";

export const QUERY_KEYS = {
  hiddenProducts: ["hidden-products"],
  productInsights: ["product-insights"],
  productInsightLogs: ["product-insight-logs"],
  emailPreferences: ["email-preferences"],
};



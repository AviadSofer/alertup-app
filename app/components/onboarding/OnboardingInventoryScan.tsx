import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BlockStack,
  Button,
  Text,
  Icon,
} from "@shopify/polaris";
import { ImageIcon, ChevronDownIcon } from "@shopify/polaris-icons";

import { OnboardingLowStockAnimation } from "app/components/Animations";

interface LowStockPreviewItem {
  id: string;
  productTitle: string;
  variantTitle?: string;
  imageUrl?: string;
  availableQuantity: number;
}

export interface PreviewState {
  totalMatching: number;
  belowThreshold: number;
  topItems?: LowStockPreviewItem[];
  distribution?: Record<string, number>;
}

interface OnboardingInventoryScanProps {
  initialPreview: PreviewState;
  initialThreshold?: number;
  onNext: (preview: PreviewState, threshold: number) => void;
}

type WindowWithShopify = Window & {
  shopify?: {
    idToken?: () => Promise<string>;
  };
};

const QUICK_SYNC_TIMEOUT_MS = 8000;

function CountUp({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setCount(target);
      return;
    }
    const duration = 800;
    const steps = Math.min(target, 30);
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <>{count}</>;
}

export function OnboardingInventoryScan({
  initialPreview,
  initialThreshold = 5,
  onNext,
}: OnboardingInventoryScanProps) {
  const [preview, setPreview] = useState(initialPreview);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [syncState, setSyncState] = useState<"checking" | "ready" | "fallback">(
    initialPreview.totalMatching > 0 ? "ready" : "checking",
  );
  const hasTriedQuickSync = useRef(false);

  useEffect(() => {
    if (initialPreview.totalMatching > 0) return;
    if (hasTriedQuickSync.current) return;
    hasTriedQuickSync.current = true;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
      setSyncState("fallback");
    }, QUICK_SYNC_TIMEOUT_MS);

    async function runQuickSync() {
      try {
        const shopifyWindow = window as WindowWithShopify;
        const token = await shopifyWindow.shopify?.idToken?.();
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        await fetch("/api/sync-inventory", {
          method: "POST",
          headers,
          signal: controller.signal,
        });

        const response = await fetch("/api/alert-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            scopeType: "all",
            threshold,
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          setPreview((await response.json()) as PreviewState);
        }
        setSyncState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Onboarding inventory preview failed:", error);
        setSyncState("fallback");
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void runQuickSync();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
      hasTriedQuickSync.current = false;
    };
  }, [initialPreview.totalMatching, threshold]);

  const localBelowThreshold = preview.distribution
    ? Object.entries(preview.distribution)
        .filter(([qtyStr]) => parseInt(qtyStr, 10) <= threshold)
        .reduce((sum, [, count]) => sum + count, 0)
    : preview.belowThreshold;

  const localTopItems = (preview.topItems || [])
    .filter((item) => item.availableQuantity <= threshold)
    .slice(0, 3);

  const hasLowStock = localBelowThreshold > 0;
  const isScanning = syncState === "checking";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: "80px", alignItems: "center", flex: 1 }}>

          {/* Left Column */}
          <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {isScanning ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <OnboardingLowStockAnimation />
                </div>
                <div style={{ textAlign: "center" }}>
                  <Text variant="headingLg" as="h2">
                    Scanning your inventory...
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text variant="bodyLg" as="p" tone="subdued">
                      We're checking your stock levels right now.
                    </Text>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text variant="headingXl" as="h2" tone="subdued">
                      You have
                    </Text>
                  </div>
                  <span
                    style={{
                      fontSize: 72,
                      fontWeight: 700,
                      color: "#008060",
                      lineHeight: 1,
                      display: "block",
                      letterSpacing: "-2px",
                    }}
                  >
                    <CountUp target={localBelowThreshold} />
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                    <Text variant="headingLg" as="h2">
                      products with
                    </Text>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <select
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        style={{
                          appearance: "none",
                          background: "#f3f4f6",
                          border: "2px solid transparent",
                          borderRadius: "12px",
                          fontSize: "24px",
                          fontWeight: "700",
                          padding: "4px 36px 4px 16px",
                          color: "#202223",
                          outline: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => ((e.target as any).style.borderColor = "#005bd3")}
                        onBlur={(e) => ((e.target as any).style.borderColor = "transparent")}
                        onMouseEnter={(e) => ((e.target as any).style.background = "#e5e7eb")}
                        onMouseLeave={(e) => ((e.target as any).style.background = "#f3f4f6")}
                      >
                        {[1, 2, 3, 5, 10, 15, 20, 50].map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                      <div
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          display: "flex",
                          alignItems: "center",
                          color: "#5c5f62"
                        }}
                      >
                        <Icon source={ChevronDownIcon} />
                      </div>
                    </div>
                    <Text variant="headingLg" as="h2">
                      or fewer units
                    </Text>
                  </div>
                  {preview.totalMatching > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text variant="bodySm" as="p" tone="subdued">
                        We scanned {preview.totalMatching.toLocaleString()} products across your store
                      </Text>
                    </div>
                  )}
                  {!hasLowStock && (
                    <div style={{ marginTop: 24 }}>
                      <Text variant="bodyLg" as="p" tone="subdued">
                        Set up alerts now so you're ready when products start running low.
                      </Text>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </div>

          {/* Right Column */}
          {(isScanning || (hasLowStock && localTopItems.length > 0)) && (
            <div style={{ flex: 1, minWidth: 360, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {isScanning ? (
              <BlockStack gap="300">
                {[0.5, 0.35, 0.2].map((opacity, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      background: "#ffffff",
                      borderRadius: 12,
                      padding: 16,
                      border: "1px solid #e5e7eb",
                      opacity,
                    }}
                  >
                    <div style={{ width: 48, height: 48, background: "#e5e7eb", borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, background: "#e5e7eb", borderRadius: 4, width: "70%", marginBottom: 6 }} />
                      <div style={{ height: 10, background: "#e5e7eb", borderRadius: 4, width: "40%" }} />
                    </div>
                    <div style={{ width: 50, height: 24, background: "#e5e7eb", borderRadius: 12 }} />
                  </div>
                ))}
              </BlockStack>
            ) : hasLowStock && localTopItems.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text as="p" variant="bodySm" tone="subdued" fontWeight="medium">
                    Your lowest-stock items
                  </Text>
                </div>
                <BlockStack gap="300">
                  {localTopItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          alignItems: "center",
                          background: "#ffffff",
                          borderRadius: 12,
                          padding: "14px 16px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            background: "#f3f4f6",
                            borderRadius: 8,
                            overflow: "hidden",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productTitle}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Icon source={ImageIcon} tone="subdued" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text as="p" variant="bodyMd" fontWeight="bold" truncate>
                            {item.productTitle}
                          </Text>
                          {item.variantTitle && item.variantTitle !== "Default Title" && (
                            <Text as="p" variant="bodySm" tone="subdued" truncate>
                              {item.variantTitle}
                            </Text>
                          )}
                        </div>
                        <div
                          style={{
                            background: "#FFF4F4",
                            padding: "4px 12px",
                            borderRadius: 20,
                            flexShrink: 0,
                          }}
                        >
                          <Text as="p" variant="bodySm" tone="critical" fontWeight="bold">
                            {item.availableQuantity} left
                          </Text>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </BlockStack>
              </motion.div>
            ) : null}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            maxWidth: 360,
            marginInline: "auto",
            width: "100%",
          }}
        >
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={() => onNext({ ...preview, belowThreshold: localBelowThreshold }, threshold)}
            loading={isScanning}
            disabled={isScanning}
          >
            {hasLowStock ? "Protect my inventory" : "Set up alerts"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

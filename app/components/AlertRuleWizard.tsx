import { useEffect, useMemo, useState } from "react";
import { useNavigate, useNavigation, useSubmit } from 'react-router';
import { AnimatePresence, motion } from "framer-motion";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  ChoiceList,
  FormLayout,
  InlineGrid,
  Select,
  Text,
  TextField,
  Thumbnail,
  Box,
} from "@shopify/polaris";
import { ImageIcon, SearchIcon, DeleteIcon, PlusIcon } from "@shopify/polaris-icons";

import { VendorPickerModal } from "./VendorPickerModal";

import type {
  AlertDeliveryMode,
  AlertRuleView,
  AlertSchedule,
  AlertScopeType,
} from "app/services/alert-rules/alert-rule.service.server";

import styles from "./AlertRuleWizard.module.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ShopifyResourceSelection {
  id: string;
  title?: string;
  image?: { originalSrc?: string; src?: string };
  images?: Array<{ originalSrc?: string; src?: string }>;
  variants?: Array<{ id: string; title?: string; image?: any }>;
}

interface ShopifyGlobal {
  idToken?: () => Promise<string>;
  resourcePicker?: (options: {
    type: "product" | "collection";
    multiple?: boolean;
    selectionIds?: Array<{ id: string; variants?: Array<{ id: string }> }>;
  }) => Promise<ShopifyResourceSelection[] | undefined>;
}

declare global {
  interface Window {
    shopify?: ShopifyGlobal;
  }
}


interface SelectedScopeItem {
  id: string;
  title: string;
  imageUrl?: string;
}

interface PreviewState {
  totalMatching: number;
  belowThreshold: number;
}

interface AlertRuleWizardProps {
  rule?: AlertRuleView | null;
  locations?: Array<{ id: string; name: string }>;
  vendors?: string[];
  defaultThreshold?: number | null;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  { key: "basics", label: "Basics & Scope" },
  { key: "thresholds", label: "Thresholds" },
  { key: "delivery", label: "Delivery" },
  { key: "recipients", label: "Recipients" },
] as const;

const dayOptions = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

/* ------------------------------------------------------------------ */
/*  Slide animation variants                                           */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
    position: "absolute" as const,
  }),
  center: {
    x: 0,
    opacity: 1,
    position: "relative" as const,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
    position: "absolute" as const,
  }),
};

const springTransition = {
  type: "spring" as const,
  stiffness: 350,
  damping: 32,
  mass: 0.8,
};

/* ================================================================== */
/*  StepIndicator                                                      */
/* ================================================================== */

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className={styles.stepIndicator}>
      {STEPS.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;

        return (
          <div className={styles.stepItem} key={step.key}>
            <div className={styles.stepRow}>
              <div
                className={`${styles.stepLine} ${idx <= currentStep ? styles.filled : ""} ${idx === 0 ? styles.invisible : ""}`}
              />
              <motion.div
                className={`${styles.stepCircle} ${isActive ? styles.active : ""} ${isCompleted ? styles.completed : ""}`}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {isCompleted ? (
                  <svg className={styles.checkmark} viewBox="0 0 18 18" fill="none">
                    <motion.path
                      d="M4 9.5L7.5 13L14 5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  </svg>
                ) : (
                  idx + 1
                )}
              </motion.div>
              <div
                className={`${styles.stepLine} ${idx < currentStep ? styles.filled : ""} ${idx === totalSteps - 1 ? styles.invisible : ""}`}
              />
            </div>
            <span
              className={`${styles.stepLabel} ${isActive ? styles.active : ""}`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Main Wizard Component                                              */
/* ================================================================== */

export function AlertRuleWizard({
  rule,
  locations = [],
  vendors = [],
  defaultThreshold,
  error,
}: AlertRuleWizardProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();

  /* ── Form state (identical to AlertRuleForm) ── */

  const [name, setName] = useState(rule?.name ?? "");
  const [scopeType, setScopeType] = useState<AlertScopeType>(
    rule?.scopeType ?? "all",
  );
  const [scopeValue, setScopeValue] = useState(rule?.scopeValue ?? "");
  const [scopeLabel, setScopeLabel] = useState(rule?.scopeLabel ?? "");
  const [selectedScopeItems, setSelectedScopeItems] = useState<SelectedScopeItem[]>([]);
  const [locationId, setLocationId] = useState(rule?.locationId ?? "");
  const [locationName, setLocationName] = useState(rule?.locationName ?? "");
  const [threshold, setThreshold] = useState(
    rule?.threshold.toString() ?? defaultThreshold?.toString() ?? "5",
  );
  const [maxStockLevel, setMaxStockLevel] = useState(
    rule?.maxStockLevel?.toString() ?? "",
  );
  const [deliveryMode, setDeliveryMode] = useState<AlertDeliveryMode>(
    rule?.deliveryMode ?? "instant",
  );
  const [schedule, setSchedule] = useState<AlertSchedule>(
    rule?.schedule ?? "daily",
  );
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(
    rule?.scheduleDayOfWeek?.toString() ?? "1",
  );
  const [recipients, setRecipients] = useState(
    rule?.recipients.length
      ? rule.recipients.map((r) => r.email)
      : [""],
  );
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  /* ── Wizard state ── */

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const isSaving = navigation.state === "submitting";
  const canUseProductPicker = typeof window !== "undefined" && window.shopify;

  const locationOptions = useMemo(() => {
    const options = [{ label: "All locations", value: "" }];
    
    if (locations && locations.length > 0) {
      locations.forEach((loc) => {
        options.push({ label: loc.name, value: loc.id });
      });
    } else if (locationId) {
      options.push({ label: locationName || locationId, value: locationId });
    }
    
    return options;
  }, [locations, locationId, locationName]);

  /* ── Preview loader (same as original) ── */

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      setPreviewError(null);

      try {
        const token = await window.shopify?.idToken?.();
        const response = await fetch("/api/alert-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            scopeType,
            scopeValue: scopeValue || null,
            threshold: Number(threshold),
            locationId: locationId || null,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Preview request failed");
        const data = (await response.json()) as PreviewState;
        setPreview(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Alert preview failed:", err);
        setPreview(null);
        setPreviewError("Preview is unavailable right now.");
      }
    }

    if (Number.isFinite(Number(threshold))) {
      void loadPreview();
    }

    return () => controller.abort();
  }, [scopeType, scopeValue, threshold, locationId]);

  /* ── Resource picker ── */

  const getImageUrl = (sel: any): string | undefined => {
    const img = sel.image ?? sel.images?.[0];
    return img?.originalSrc ?? img?.src;
  };

  const pickResource = async (type: "product" | "collection", variantMode: boolean) => {
    // If we're picking variants, the scopeValue contains variant IDs.
    // If we're picking products or collections, it contains product/collection IDs.
    const currentIds = scopeValue ? scopeValue.split(",") : [];
    const selectionIds = currentIds.map((id) => ({ id }));

    const selection = await window.shopify?.resourcePicker?.({
      type,
      multiple: true,
      selectionIds: selectionIds.length > 0 ? selectionIds : undefined,
      filter: type === "product" && !variantMode ? { variants: false } : undefined,
    });
    
    if (!selection || selection.length === 0) return;

    if (type === "collection") {
      const ids = selection.map((s: any) => s.id).join(",");
      const titles = selection.map((s: any) => s.title ?? "Collection").join(", ");
      setScopeValue(ids);
      setScopeLabel(titles);
      setSelectedScopeItems(selection.map((s: any) => ({
        id: s.id,
        title: s.title ?? "Collection",
        imageUrl: getImageUrl(s),
      })));
    } else {
      // product or variant
      if (variantMode) {
        const variants = selection.flatMap((p: any) => 
          (p.variants ?? []).map((v: any) => ({
            id: v.id,
            title: p.title ? `${p.title} / ${v.title}` : (v.title ?? "Variant"),
            imageUrl: getImageUrl(p),
          }))
        );
        if (variants.length > 0) {
          setScopeValue(variants.map((v: any) => v.id).join(","));
          setScopeLabel(variants.map((v: any) => v.title).join(", "));
          setSelectedScopeItems(variants);
        }
      } else {
        const ids = selection.map((s: any) => s.id).join(",");
        const titles = selection.map((s: any) => s.title ?? "Product").join(", ");
        setScopeValue(ids);
        setScopeLabel(titles);
        setSelectedScopeItems(selection.map((s: any) => ({
          id: s.id,
          title: s.title ?? "Product",
          imageUrl: getImageUrl(s),
        })));
      }
    }
  };

  /* ── Submit (same as original) ── */

  const handleSubmit = () => {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("scopeType", scopeType);
    formData.set("scopeValue", scopeValue);
    formData.set("scopeLabel", scopeLabel);
    formData.set("locationId", locationId);
    formData.set("locationName", locationName);
    formData.set("threshold", threshold);
    formData.set("maxStockLevel", maxStockLevel);
    formData.set("deliveryMode", deliveryMode);
    formData.set("schedule", deliveryMode === "scheduled" ? schedule : "");
    formData.set(
      "scheduleDayOfWeek",
      deliveryMode === "scheduled" && schedule === "weekly"
        ? scheduleDayOfWeek
        : "",
    );

    recipients.forEach((r) => {
      formData.append("recipients", r);
    });

    submit(formData, { method: "post" });
  };

  /* ── Step validation ── */

  const validateCurrentStep = (): string | null => {
    switch (currentStep) {
      case 0:
        if (!name.trim()) return "Rule name is required.";
        if (scopeType !== "all" && !scopeValue && !scopeLabel) {
          return "Choose or enter a scope value.";
        }
        return null;
      case 1:
        if (!Number.isFinite(Number(threshold)) || Number(threshold) < 0) {
          return "Threshold must be a number at or above 0.";
        }
        if (
          maxStockLevel &&
          (!Number.isFinite(Number(maxStockLevel)) || Number(maxStockLevel) < 0)
        ) {
          return "Max stock level must be a number at or above 0.";
        }
        return null;
      case 2:
        return null;
      case 3:
        if (!recipients.some((email) => email.trim().length > 0)) {
          return "Add at least one recipient email.";
        }
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateCurrentStep();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepError(null);
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  /* ── Scope label helpers ── */

  const formatScopeDisplay = () => {
    if (scopeType === "all") return "All products";
    if (scopeLabel) return scopeLabel;
    if (scopeValue) return scopeValue;
    return scopeType.charAt(0).toUpperCase() + scopeType.slice(1);
  };

  const formatDeliveryDisplay = () => {
    if (deliveryMode === "instant") return "Instant";
    if (schedule === "weekly") {
      const day = dayOptions.find((d) => d.value === scheduleDayOfWeek);
      return `Weekly — ${day?.label ?? ""}`;
    }
    return "Daily digest";
  };

  /* ================================================================ */
  /*  Step renderers                                                   */
  /* ================================================================ */

  const renderStep0 = () => (
    <BlockStack gap="500">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card>
          <BlockStack gap="400">
            <div className={styles.sectionHeader}>
              <Text as="h2" variant="headingLg">
                Rule Name
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Give your alert rule a descriptive name.
              </Text>
            </div>
            <FormLayout>
              <TextField
                label="Name"
                value={name}
                onChange={setName}
                autoComplete="off"
                placeholder="e.g. Low stock — all products"
              />
            </FormLayout>
          </BlockStack>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <Card>
          <BlockStack gap="400">
            <div className={styles.sectionHeader}>
              <Text as="h2" variant="headingLg">
                Scope
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Choose which products this rule should monitor.
              </Text>
            </div>
            <div className={styles.scopeLayout}>
              {/* Left column — scope type choices + picker button */}
              <div className={styles.scopeChoices}>
                <ChoiceList
                  title="Products to monitor"
                  titleHidden
                  choices={[
                    { label: "All products", value: "all" },
                    { label: "Collection", value: "collection" },
                    { label: "Product", value: "product" },
                    { label: "Variant", value: "variant" },
                    { label: "Vendor", value: "vendor" },
                  ]}
                  selected={[scopeType]}
                  onChange={(selected) => {
                    setScopeType(selected[0] as AlertScopeType);
                    setScopeValue("");
                    setScopeLabel("");
                    setSelectedScopeItems([]);
                  }}
                />

                {scopeType === "collection" ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Button
                      icon={SearchIcon}
                      onClick={() => pickResource("collection", false)}
                      disabled={!canUseProductPicker}
                    >
                      Pick collection
                    </Button>
                  </motion.div>
                ) : null}

                {scopeType === "product" || scopeType === "variant" ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Button
                      icon={SearchIcon}
                      onClick={() => pickResource("product", scopeType === "variant")}
                      disabled={!canUseProductPicker}
                    >
                      Pick {scopeType}
                    </Button>
                  </motion.div>
                ) : null}

                {scopeType === "vendor" ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Button
                      icon={SearchIcon}
                      onClick={() => setIsVendorModalOpen(true)}
                    >
                      Pick vendor
                    </Button>
                    <VendorPickerModal
                      open={isVendorModalOpen}
                      onClose={() => setIsVendorModalOpen(false)}
                      vendors={vendors}
                      initialSelected={scopeValue ? scopeValue.split(',').map(s => s.trim()).filter(Boolean) : []}
                      onSelect={(selected) => {
                        setScopeValue(selected.join(','));
                        setScopeLabel(selected.join(', '));
                        setSelectedScopeItems(selected.map(v => ({ id: v, title: v })));
                      }}
                    />
                  </motion.div>
                ) : null}
              </div>

              {/* Right column — selected items preview */}
              {scopeType !== "all" ? (
                <div className={styles.scopePreview}>
                  <div className={styles.scopePreviewHeader}>
                    <Text as="span" variant="headingSm">
                      Selected {scopeType === "collection" ? "collections" : scopeType === "product" ? "products" : scopeType === "vendor" ? "vendors" : "variants"}
                    </Text>
                    {selectedScopeItems.length > 0 ? (
                      <span className={styles.scopePreviewBadge}>
                        {selectedScopeItems.length}
                      </span>
                    ) : null}
                  </div>
                  {selectedScopeItems.length > 0 ? (
                    <div className={styles.scopePreviewList}>
                      {selectedScopeItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          className={styles.scopePreviewItem}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                        >
                          <Thumbnail
                            source={item.imageUrl || ImageIcon}
                            alt={item.title}
                            size="small"
                          />
                          <span className={styles.scopePreviewItemTitle}>
                            {item.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className={styles.scopePreviewEmpty}
                      onClick={() => {
                        if (scopeType === "vendor") {
                          setIsVendorModalOpen(true);
                        } else if (canUseProductPicker) {
                          pickResource(scopeType === "collection" ? "collection" : "product", scopeType === "variant");
                        }
                      }}
                      style={{ cursor: scopeType === "vendor" || canUseProductPicker ? "pointer" : "default" }}
                    >
                      <div className={styles.scopePreviewEmptyIcon}>
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <rect x="4" y="8" width="32" height="24" rx="4" stroke="var(--p-color-border)" strokeWidth="1.5" strokeDasharray="4 3" />
                          <path d="M16 20h8M20 16v8" stroke="var(--p-color-icon-secondary)" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Click to browse and select
                      </Text>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </BlockStack>
        </Card>
      </motion.div>
    </BlockStack>
  );

  const renderStep1 = () => (
    <BlockStack gap="500">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card>
          <BlockStack gap="400">
            <div className={styles.sectionHeader}>
              <Text as="h2" variant="headingLg">
                Stock Thresholds
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Define when this alert should trigger and your ideal stock levels.
              </Text>
            </div>
            <FormLayout>
              <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                <TextField
                  label="Alert when stock falls to or below"
                  type="number"
                  min={0}
                  value={threshold}
                  onChange={setThreshold}
                  autoComplete="off"
                />
                <TextField
                  label="Order-up-to level (max stock to keep)"
                  type="number"
                  min={0}
                  value={maxStockLevel}
                  onChange={setMaxStockLevel}
                  helpText="We'll calculate how many units to reorder."
                  autoComplete="off"
                />
              </InlineGrid>
            </FormLayout>
          </BlockStack>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <Card>
          <BlockStack gap="400">
            <div className={styles.sectionHeader}>
              <Text as="h2" variant="headingLg">
                Location
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Filter inventory by a specific location, or monitor all.
              </Text>
            </div>
            <FormLayout>
              <Select
                label="Location"
                labelHidden
                options={locationOptions}
                value={locationId}
                onChange={(value) => {
                  setLocationId(value);
                  setLocationName(
                    locationOptions.find((o) => o.value === value)?.label ?? "",
                  );
                }}
              />
            </FormLayout>
          </BlockStack>
        </Card>
      </motion.div>

      {preview || previewError ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingLg">
                Preview
              </Text>
              <div className={styles.wizardPreviewContent}>
                {preview ? (
                  <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                    <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" tone="subdued">Matching items</Text>
                        <Text as="p" variant="headingLg">{preview.totalMatching}</Text>
                      </BlockStack>
                    </Box>
                    <Box background="bg-surface-warning" padding="400" borderRadius="200">
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" tone="subdued">Below threshold</Text>
                        <Text as="p" variant="headingLg" tone="critical">{preview.belowThreshold}</Text>
                      </BlockStack>
                    </Box>
                  </InlineGrid>
                ) : (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {previewError ?? "Calculating preview..."}
                  </Text>
                )}
              </div>
            </BlockStack>
          </Card>
        </motion.div>
      ) : null}
    </BlockStack>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <Card>
        <BlockStack gap="400">
          <div className={styles.sectionHeader}>
            <Text as="h2" variant="headingLg">
              Delivery Mode
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Choose how and when you'd like to receive alerts.
            </Text>
          </div>
          <FormLayout>
            <ChoiceList
              title="Delivery mode"
              titleHidden
              choices={[
                {
                  label: "Instant — get notified immediately when stock is low",
                  value: "instant",
                },
                {
                  label: "Scheduled — receive a summary on a schedule",
                  value: "scheduled",
                },
              ]}
              selected={[deliveryMode]}
              onChange={(selected) =>
                setDeliveryMode(selected[0] as AlertDeliveryMode)
              }
            />

            <AnimatePresence mode="wait">
              {deliveryMode === "scheduled" ? (
                <motion.div
                  key="schedule-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                    <Select
                      label="Frequency"
                      options={[
                        { label: "Daily", value: "daily" },
                        { label: "Weekly", value: "weekly" },
                      ]}
                      value={schedule}
                      onChange={(value) => setSchedule(value as AlertSchedule)}
                    />
                    {schedule === "weekly" ? (
                      <Select
                        label="Day of week"
                        options={dayOptions}
                        value={scheduleDayOfWeek}
                        onChange={setScheduleDayOfWeek}
                      />
                    ) : null}
                  </InlineGrid>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </FormLayout>
        </BlockStack>
      </Card>
    </motion.div>
  );

  const renderStep3 = () => (
    <BlockStack gap="500">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card>
          <BlockStack gap="400">
            <div className={styles.sectionHeader}>
              <Text as="h2" variant="headingLg">
                Review
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Here's a summary of your alert rule. Review and add recipients below.
              </Text>
            </div>
            <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm" tone="subdued">Rule name</Text>
                <Text as="p" variant="bodyMd">{name || "—"}</Text>
              </BlockStack>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm" tone="subdued">Threshold</Text>
                <Text as="p" variant="bodyMd">≤ {threshold} units</Text>
              </BlockStack>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm" tone="subdued">Delivery</Text>
                <Text as="p" variant="bodyMd">{formatDeliveryDisplay()}</Text>
              </BlockStack>
            </InlineGrid>
            
            <div style={{ marginTop: '8px' }}>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm" tone="subdued">Scope</Text>
                {selectedScopeItems.length > 0 ? (
                  <div className={styles.scopePreview} style={{ marginTop: '4px' }}>
                    <div className={styles.scopePreviewHeader}>
                      <Text as="span" variant="headingSm">
                        Selected {scopeType === "collection" ? "collections" : scopeType === "product" ? "products" : "variants"}
                      </Text>
                      <span className={styles.scopePreviewBadge}>
                        {selectedScopeItems.length}
                      </span>
                    </div>
                    <div className={styles.scopePreviewList}>
                      {selectedScopeItems.map((item) => (
                        <div key={item.id} className={styles.scopePreviewItem}>
                          <Thumbnail source={item.imageUrl || ImageIcon} alt={item.title} size="small" />
                          <span className={styles.scopePreviewItemTitle}>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Text as="p" variant="bodyMd">{formatScopeDisplay()}</Text>
                )}
              </BlockStack>
            </div>
          </BlockStack>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <Card>
          <BlockStack gap="400">
            <div className={styles.sectionHeader}>
              <Text as="h2" variant="headingLg">
                Recipients
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Who should receive this alert?
              </Text>
            </div>
            {recipients.map((recipient, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <TextField
                  label={`Recipient ${index + 1}`}
                  labelHidden={index > 0}
                  type="email"
                  value={recipient}
                  onChange={(value) =>
                    setRecipients((current) =>
                      current.map((item, i) => (i === index ? value : item)),
                    )
                  }
                  autoComplete="email"
                  connectedRight={
                    <Button
                      icon={DeleteIcon}
                      disabled={recipients.length === 1}
                      onClick={() =>
                        setRecipients((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      accessibilityLabel="Remove recipient"
                    />
                  }
                />
              </motion.div>
            ))}
            <div style={{ paddingTop: '8px' }}>
              <Button icon={PlusIcon} onClick={() => setRecipients((current) => [...current, ""])}>
                Add recipient
              </Button>
            </div>
          </BlockStack>
        </Card>
      </motion.div>
    </BlockStack>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <BlockStack gap="500">
      {/* Server-side error banner */}
      {error ? (
        <Banner title="Rule could not be saved" tone="critical">
          <p>{error}</p>
        </Banner>
      ) : null}

      {/* Step indicator */}
      <Card>
        <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} />
      </Card>

      {/* Step validation error */}
      <AnimatePresence mode="wait">
        {stepError ? (
          <motion.div
            key="step-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Banner tone="warning" onDismiss={() => setStepError(null)}>
              <p>{stepError}</p>
            </Banner>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Animated step content */}
      <div className={styles.wizardContent}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springTransition}
            className={styles.stepContent}
          >
            {stepRenderers[currentStep]()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className={styles.navBar}>
        <span className={styles.stepCounter}>
          Step {currentStep + 1} of {STEPS.length}
        </span>
        <div className={styles.navBarRight}>
          {currentStep === 0 ? (
            <Button onClick={() => navigate("/app/alerts")}>Cancel</Button>
          ) : (
            <Button onClick={goBack}>Back</Button>
          )}
          {isLastStep ? (
            <Button variant="primary" loading={isSaving} onClick={handleSubmit}>
              {rule ? "Save rule" : "Create rule"}
            </Button>
          ) : (
            <Button variant="primary" onClick={goNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </BlockStack>
  );
}

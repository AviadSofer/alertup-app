import { useEffect, useMemo, useState } from "react";
import { useNavigate, useNavigation, useSubmit } from 'react-router';
import {
  Banner,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  ChoiceList,
  FormLayout,
  InlineGrid,
  InlineStack,
  Select,
  Text,
  TextField,
  Box,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

import { VendorPickerModal } from "./VendorPickerModal";

import type {
  AlertDeliveryMode,
  AlertRuleInput,
  AlertRuleView,
  AlertSchedule,
  AlertScopeType,
} from "app/services/alert-rules/alert-rule.service.server";



interface AlertRuleFormProps {
  rule?: AlertRuleView | null;
  locations?: Array<{ id: string; name: string }>;
  vendors?: string[];
  defaultThreshold?: number | null;
  error?: string;
}

interface PreviewState {
  totalMatching: number;
  belowThreshold: number;
}

const dayOptions = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

export function AlertRuleForm({
  rule,
  locations = [],
  vendors = [],
  defaultThreshold,
  error,
}: AlertRuleFormProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [name, setName] = useState(rule?.name ?? "");
  const [scopeType, setScopeType] = useState<AlertScopeType>(
    rule?.scopeType ?? "all",
  );
  const [scopeValue, setScopeValue] = useState(rule?.scopeValue ?? "");
  const [scopeLabel, setScopeLabel] = useState(rule?.scopeLabel ?? "");
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
      ? rule.recipients.map((recipient) => recipient.email)
      : [""],
  );
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
      } catch (previewLoadError) {
        if (controller.signal.aborted) return;
        console.error("Alert preview failed:", previewLoadError);
        setPreview(null);
        setPreviewError("Preview is unavailable right now.");
      }
    }

    if (Number.isFinite(Number(threshold))) {
      void loadPreview();
    }

    return () => controller.abort();
  }, [scopeType, scopeValue, threshold, locationId]);

  const handleSubmit = () => {
    submit(buildAlertRuleFormData({
      name,
      enabled: rule?.enabled ?? true,
      scopeType,
      scopeValue,
      scopeLabel,
      locationId,
      locationName,
      threshold,
      maxStockLevel,
      deliveryMode,
      schedule,
      scheduleDayOfWeek,
      recipients,
    }), { method: "post" });
  };

  const pickResource = async (type: "product" | "collection", variantMode: boolean) => {
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
    } else {
      // product or variant
      if (variantMode) {
        const variants = selection.flatMap((p: any) => 
          (p.variants ?? []).map((v: any) => ({ id: v.id, title: p.title ? `${p.title} / ${v.title}` : v.title }))
        );
        if (variants.length > 0) {
          setScopeValue(variants.map((v: any) => v.id).join(","));
          setScopeLabel(variants.map((v: any) => v.title).join(", "));
        }
      } else {
        const ids = selection.map((s: any) => s.id).join(",");
        const titles = selection.map((s: any) => s.title ?? "Product").join(", ");
        setScopeValue(ids);
        setScopeLabel(titles);
      }
    }
  };

  return (
    <BlockStack gap="400">
      {error ? (
        <Banner title="Rule could not be saved" tone="critical">
          <p>{error}</p>
        </Banner>
      ) : null}

      <Card>
        <FormLayout>
          <TextField
            label="Rule name"
            value={name}
            onChange={setName}
            autoComplete="off"
          />
        </FormLayout>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Scope
          </Text>
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
            }}
          />

          {scopeType === "collection" ? (
            <InlineStack gap="300" blockAlign="end">
              <TextField
                label="Collection(s)"
                value={scopeLabel || scopeValue}
                onChange={setScopeLabel}
                autoComplete="off"
              />
              <Button
                onClick={() => pickResource("collection", false)}
                disabled={!canUseProductPicker}
              >
                Pick collection
              </Button>
            </InlineStack>
          ) : null}

          {scopeType === "product" || scopeType === "variant" ? (
            <InlineStack gap="300" blockAlign="end">
              <TextField
                label={scopeType === "product" ? "Product(s)" : "Variant(s)"}
                value={scopeLabel || scopeValue}
                onChange={setScopeLabel}
                autoComplete="off"
              />
              <Button
                onClick={() => pickResource("product", scopeType === "variant")}
                disabled={!canUseProductPicker}
              >
                Pick {scopeType}
              </Button>
            </InlineStack>
          ) : null}

          {scopeType === "vendor" ? (
            <InlineStack gap="300" blockAlign="end">
              <TextField
                label="Vendor(s)"
                value={scopeLabel || scopeValue}
                onChange={setScopeLabel}
                autoComplete="off"
              />
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
                }}
              />
            </InlineStack>
          ) : null}
        </BlockStack>
      </Card>

      <Card>
        <FormLayout>
          <Select
            label="Location"
            options={locationOptions}
            value={locationId}
            onChange={(value) => {
              setLocationId(value);
              setLocationName(
                locationOptions.find((option) => option.value === value)?.label ?? "",
              );
            }}
          />
          <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
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
      </Card>

      <Card>
        <FormLayout>
          <ChoiceList
            title="Delivery mode"
            choices={[
              { label: "Instant", value: "instant" },
              { label: "Scheduled", value: "scheduled" },
            ]}
            selected={[deliveryMode]}
            onChange={(selected) =>
              setDeliveryMode(selected[0] as AlertDeliveryMode)
            }
          />

          {deliveryMode === "scheduled" ? (
            <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
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
          ) : null}
        </FormLayout>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Recipients
          </Text>
          {recipients.map((recipient, index) => (
            <InlineStack key={index} gap="300" blockAlign="end">
              <TextField
                label={`Recipient ${index + 1}`}
                type="email"
                value={recipient}
                onChange={(value) =>
                  setRecipients((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? value : item,
                    ),
                  )
                }
                autoComplete="email"
              />
              <Button
                disabled={recipients.length === 1}
                onClick={() =>
                  setRecipients((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                Remove
              </Button>
            </InlineStack>
          ))}
          <Button onClick={() => setRecipients((current) => [...current, ""])}>
            Add recipient
          </Button>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            Preview
          </Text>
          {preview ? (
            <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
              <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Matching inventory items</Text>
                  <Text as="p" variant="headingLg">{preview.totalMatching}</Text>
                </BlockStack>
              </Box>
              <Box background="bg-surface-warning" padding="400" borderRadius="200">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Currently below threshold</Text>
                  <Text as="p" variant="headingLg" tone="critical">{preview.belowThreshold}</Text>
                </BlockStack>
              </Box>
            </InlineGrid>
          ) : (
            <Text as="p" tone="subdued">
              {previewError ?? "Calculating preview..."}
            </Text>
          )}
        </BlockStack>
      </Card>

      <InlineStack align="end">
        <ButtonGroup>
          <Button onClick={() => navigate("/app/alerts")}>Cancel</Button>
          <Button variant="primary" loading={isSaving} onClick={handleSubmit}>
            Save rule
          </Button>
        </ButtonGroup>
      </InlineStack>
    </BlockStack>
  );
}

export interface AlertRuleFormValues {
  name: string;
  enabled?: boolean;
  scopeType: AlertScopeType;
  scopeValue: string;
  scopeLabel: string;
  locationId: string;
  locationName: string;
  threshold: string;
  maxStockLevel: string;
  deliveryMode: AlertDeliveryMode;
  schedule: AlertSchedule;
  scheduleDayOfWeek: string;
  recipients: string[];
}

export function buildAlertRuleFormData(values: AlertRuleFormValues): FormData {
  const formData = new FormData();
  formData.set("name", values.name);
  formData.set("enabled", String(values.enabled ?? true));
  formData.set("scopeType", values.scopeType);
  formData.set("scopeValue", values.scopeValue);
  formData.set("scopeLabel", values.scopeLabel);
  formData.set("locationId", values.locationId);
  formData.set("locationName", values.locationName);
  formData.set("threshold", values.threshold);
  formData.set("maxStockLevel", values.maxStockLevel);
  formData.set("deliveryMode", values.deliveryMode);
  formData.set(
    "schedule",
    values.deliveryMode === "scheduled" ? values.schedule : "",
  );
  formData.set(
    "scheduleDayOfWeek",
    values.deliveryMode === "scheduled" && values.schedule === "weekly"
      ? values.scheduleDayOfWeek
      : "",
  );
  values.recipients.forEach((recipient) => {
    formData.append("recipients", recipient);
  });
  return formData;
}

export function parseAlertRuleFormData(formData: FormData): AlertRuleInput {
  const deliveryMode = String(formData.get("deliveryMode")) as AlertDeliveryMode;
  const schedule = String(formData.get("schedule") || "") as AlertSchedule | "";
  const scheduleDay = String(formData.get("scheduleDayOfWeek") || "");
  const maxStockLevel = String(formData.get("maxStockLevel") || "");
  const enabledValue = formData.get("enabled");

  return {
    name: String(formData.get("name") ?? "").trim(),
    enabled: enabledValue === null ? undefined : enabledValue === "true",
    scopeType: String(formData.get("scopeType") ?? "all") as AlertScopeType,
    scopeValue: String(formData.get("scopeValue") || "") || null,
    scopeLabel: String(formData.get("scopeLabel") || "") || null,
    threshold: Number(formData.get("threshold")),
    maxStockLevel: maxStockLevel ? Number(maxStockLevel) : null,
    locationId: String(formData.get("locationId") || "") || null,
    locationName: String(formData.get("locationName") || "") || null,
    deliveryMode,
    schedule: schedule || null,
    scheduleDayOfWeek: scheduleDay ? Number(scheduleDay) : null,
    recipients: formData.getAll("recipients").map(String),
  };
}

export function validateAlertRuleInput(input: AlertRuleInput) {
  if (!input.name) return "Rule name is required.";
  if (!Number.isInteger(input.threshold) || input.threshold < 0) {
    return "Threshold must be a whole number at or above 0.";
  }
  if (
    input.maxStockLevel != null &&
    (!Number.isInteger(input.maxStockLevel) || input.maxStockLevel < 0)
  ) {
    return "Max stock level must be a whole number at or above 0.";
  }
  if (!input.recipients.some((email) => email.trim().length > 0)) {
    return "Add at least one recipient email.";
  }
  if (input.scopeType !== "all" && !input.scopeValue && !input.scopeLabel) {
    return "Choose or enter a scope value.";
  }

  return null;
}

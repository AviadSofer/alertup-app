import { useCallback, useEffect, useRef, useState } from "react";
import {
  Banner,
  BlockStack,
  Button,
  Checkbox,
  ChoiceList,
  FormLayout,
  InlineGrid,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

import {
  buildAlertRuleFormData,
  parseAlertRuleFormData,
  validateAlertRuleInput,
} from "./AlertRuleForm";
import type {
  AlertDeliveryMode,
  AlertRuleView,
  AlertSchedule,
} from "../services/alert-rules/alert-rule.service.server";
import { formatRuleScope } from "../lib/alert-rule-display";

const dayOptions = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

interface AlertRuleQuickEditFormProps {
  rule: AlertRuleView;
  error?: string;
  saveTrigger: number;
  onSave: (formData: FormData) => void;
}

export function AlertRuleQuickEditForm({
  rule,
  error,
  saveTrigger,
  onSave,
}: AlertRuleQuickEditFormProps) {
  const [name, setName] = useState(rule.name);
  const [enabled, setEnabled] = useState(rule.enabled);
  const [threshold, setThreshold] = useState(rule.threshold.toString());
  const [deliveryMode, setDeliveryMode] = useState<AlertDeliveryMode>(
    rule.deliveryMode,
  );
  const [schedule, setSchedule] = useState<AlertSchedule>(
    rule.schedule ?? "daily",
  );
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(
    rule.scheduleDayOfWeek?.toString() ?? "1",
  );
  const [recipients, setRecipients] = useState(
    rule.recipients.length
      ? rule.recipients.map((r) => r.email)
      : [""],
  );
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    setName(rule.name);
    setEnabled(rule.enabled);
    setThreshold(rule.threshold.toString());
    setDeliveryMode(rule.deliveryMode);
    setSchedule(rule.schedule ?? "daily");
    setScheduleDayOfWeek(rule.scheduleDayOfWeek?.toString() ?? "1");
    setRecipients(
      rule.recipients.length ? rule.recipients.map((r) => r.email) : [""],
    );
    setClientError(null);
  }, [rule]);

  const handleSave = useCallback(() => {
    const formData = buildAlertRuleFormData({
      name,
      enabled,
      scopeType: rule.scopeType,
      scopeValue: rule.scopeValue ?? "",
      scopeLabel: rule.scopeLabel ?? "",
      locationId: rule.locationId ?? "",
      locationName: rule.locationName ?? "",
      threshold,
      maxStockLevel: rule.maxStockLevel?.toString() ?? "",
      deliveryMode,
      schedule,
      scheduleDayOfWeek,
      recipients,
    });

    const validationError = validateAlertRuleInput(parseAlertRuleFormData(formData));
    if (validationError) {
      setClientError(validationError);
      return;
    }

    setClientError(null);
    onSave(formData);
  }, [
    name,
    enabled,
    rule,
    threshold,
    deliveryMode,
    schedule,
    scheduleDayOfWeek,
    recipients,
    onSave,
  ]);

  const lastProcessedTrigger = useRef(0);

  useEffect(() => {
    if (saveTrigger > 0 && saveTrigger !== lastProcessedTrigger.current) {
      lastProcessedTrigger.current = saveTrigger;
      handleSave();
    }
  }, [saveTrigger, handleSave]);

  const displayError = clientError ?? error;

  return (
    <BlockStack gap="400">
      {displayError ? (
        <Banner title="Could not save" tone="critical">
          <p>{displayError}</p>
        </Banner>
      ) : null}

      <FormLayout>
        <TextField
          label="Rule name"
          value={name}
          onChange={setName}
          autoComplete="off"
        />
        <Checkbox
          label="Rule is active"
          checked={enabled}
          onChange={setEnabled}
        />
        <TextField
          label="Alert when stock falls to or below"
          type="number"
          min={0}
          value={threshold}
          onChange={setThreshold}
          autoComplete="off"
        />
      </FormLayout>

      <BlockStack gap="200">
        <Text as="span" tone="subdued" variant="bodySm">
          Scope
        </Text>
        <Text as="p" variant="bodyMd">
          {formatRuleScope(rule.scopeType, rule.scopeLabel)}
        </Text>
        <Text as="p" tone="subdued" variant="bodySm">
          To change which products this rule monitors, use the full editor.
        </Text>
      </BlockStack>

      <FormLayout>
        <ChoiceList
          title="Delivery"
          choices={[
            { label: "Instant", value: "instant" },
            { label: "Scheduled digest", value: "scheduled" },
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

      <BlockStack gap="300">
        <Text as="h3" variant="headingSm">
          Recipients
        </Text>
        {recipients.map((recipient, index) => (
          <InlineStack key={index} gap="200" blockAlign="end" wrap={false}>
            <div style={{ flex: 1 }}>
              <TextField
                label={`Recipient ${index + 1}`}
                labelHidden={index > 0}
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
            </div>
            <Button
              variant="plain"
              tone="critical"
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
        <Button
          variant="plain"
          onClick={() => setRecipients((current) => [...current, ""])}
        >
          Add recipient
        </Button>
      </BlockStack>
    </BlockStack>
  );
}

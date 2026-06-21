import { Card, Checkbox, Text } from "@shopify/polaris";
import { useEmailPreferencesQuery } from "../hooks/use-email-preferences.query";
import { useUpdateEmailPreferencesMutation } from "../hooks/use-update-email-preferences.mutation";
import { useCallback } from "react";
import { useToast } from "./Toast";
import { LoadingSpinner } from "./LoadingSpinner";

export function EmailPreferencesPanel() {
  const {
    data: preferences,
    isLoading,
    isFetching,
  } = useEmailPreferencesQuery();
  const { mutate: updatePreferences } = useUpdateEmailPreferencesMutation();
  const { showToast } = useToast();

  // Handle checkbox change
  const handleChange = useCallback(
    (key: "receiveProductInsightsEmails" | "receiveStockAlertEmails") => {
      return (checked: boolean) => {
        updatePreferences({ [key]: checked });
        showToast({
          content: "Preferences updated successfully",
        });
      };
    },
    [updatePreferences, showToast],
  );

  return (
    <Card>
      <div style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px" }}>
          <Text variant="headingMd" as="h2">
            Email Preferences
          </Text>
        </div>
        <Text variant="bodyMd" as="p">
          Manage the types of emails you receive from the system
        </Text>
      </div>

      {isLoading || isFetching ? (
        <LoadingSpinner text="Loading email preferences..." />
      ) : (
        <div style={{ padding: "16px", borderTop: "1px solid #e1e3e5" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Checkbox
              label="Receive daily product insights emails"
              helpText="Daily emails with insights and information about your store's products"
              checked={preferences?.receiveProductInsightsEmails}
              onChange={handleChange("receiveProductInsightsEmails")}
              disabled={isLoading}
            />

            <Checkbox
              label="Receive real-time inventory alerts"
              helpText="Immediate alerts when inventory changes and there might be an issue"
              checked={preferences?.receiveStockAlertEmails}
              onChange={handleChange("receiveStockAlertEmails")}
              disabled={isLoading}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

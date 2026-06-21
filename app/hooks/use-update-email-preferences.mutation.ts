import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/Toast";
import { QUERY_KEYS } from "app/constants";

interface UpdateEmailPreferencesParams {
  receiveProductInsightsEmails?: boolean;
  receiveStockAlertEmails?: boolean;
}

async function updateEmailPreferences(
  preferences: UpdateEmailPreferencesParams,
) {
  const formData = new FormData();
  if (preferences.receiveProductInsightsEmails !== undefined) {
    formData.append(
      "receiveProductInsightsEmails",
      preferences.receiveProductInsightsEmails.toString(),
    );
  }

  if (preferences.receiveStockAlertEmails !== undefined) {
    formData.append(
      "receiveStockAlertEmails",
      preferences.receiveStockAlertEmails.toString(),
    );
  }

  const response = await fetch("/api/email-preferences", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to update email preferences");
  }

  return await response.json();
}

export function useUpdateEmailPreferencesMutation() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmailPreferences,
    onSuccess: () => {
      showToast({
        content: "Email preferences updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emailPreferences });
    },
    onError: (error) => {
      showToast({
        content: `Error updating email preferences: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: true,
      });
    },
  });
}

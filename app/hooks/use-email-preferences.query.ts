import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "app/constants";

interface EmailPreferences {
  receiveProductInsightsEmails: boolean;
  receiveStockAlertEmails: boolean;
}

export function useEmailPreferencesQuery() {
  return useQuery<EmailPreferences>({
    queryKey: QUERY_KEYS.emailPreferences,
    queryFn: async () => {
      const response = await fetch("/api/email-preferences");

      if (!response.ok) {
        throw new Error("Error fetching email preferences");
      }

      return await response.json();
    },
    initialData: {
      receiveProductInsightsEmails: true,
      receiveStockAlertEmails: true,
    },
  });
}

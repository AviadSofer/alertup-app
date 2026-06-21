import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "app/constants";

export interface ProductInsightLog {
  id: string;
  shopId: string;
  productId: string;
  productTitle: string;
  variantId: string | null;
  variantTitle: string | null;
  currentInventory: number;
  dailyRate: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
}

export function useProductInsightLogsQuery() {
  return useQuery<ProductInsightLog[]>({
    queryKey: QUERY_KEYS.productInsightLogs,
    queryFn: async () => {
      const response = await fetch("/api/product-insight-logs");

      if (!response.ok) {
        throw new Error("Error fetching product insight logs");
      }

      const data = await response.json();
      return data.insightLogs;
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import type { ProductInsight } from "../models/product-insights.server";
import { QUERY_KEYS } from "app/constants";

export function useProductInsightsQuery(initialData?: ProductInsight[], historyDays: number = 30) {
  return useQuery<ProductInsight[]>({
    queryKey: [...QUERY_KEYS.productInsights, historyDays],
    queryFn: async () => {
      const response = await fetch(`/api/product-insights?historyDays=${historyDays}`);

      if (!response.ok) {
        throw new Error("Error fetching product insights");
      }

      const data = await response.json();
      return data.productInsights;
    },
    initialData,
  });
}

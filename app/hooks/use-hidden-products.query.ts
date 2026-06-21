import { useQuery } from "@tanstack/react-query";
import type { HiddenProduct } from "../components/HiddenProductsTable";
import { QUERY_KEYS } from "app/constants";

export function useHiddenProductsQuery() {
  return useQuery<HiddenProduct[]>({
    queryKey: QUERY_KEYS.hiddenProducts,
    queryFn: async () => {
      const response = await fetch("/settings/hidden-products");

      if (!response.ok) {
        throw new Error("Error while fetching");
      }

      const data = await response.json();
      return data.hiddenProducts || [];
    },
  });
}

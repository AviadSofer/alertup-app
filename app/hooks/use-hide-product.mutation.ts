import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/Toast";
import { QUERY_KEYS } from "app/constants";

interface HideInsightParams {
  productId: string;
  variantId: string | null;
  insightTitle?: string;
}

async function hideInsight({ productId, variantId }: HideInsightParams) {
  const formData = new FormData();
  formData.append("productId", productId);
  if (variantId) formData.append("variantId", variantId);

  await fetch("/insights/hide", {
    method: "POST",
    body: formData,
  });

  return { productId, variantId };
}

export function useHideProductMutation() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<
    { productId: string; variantId: string | null },
    Error,
    HideInsightParams
  >({
    mutationFn: hideInsight,
    onSuccess: (_, variables) => {
      showToast({
        content: `${variables.insightTitle || "Insight"} has been hidden.  You can change this in settings.`,
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productInsights });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hiddenProducts });
    },
    onError: (error) => {
      showToast({
        content: `Error hiding insight: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: true,
      });
    },
  });
}

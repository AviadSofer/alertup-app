import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/Toast";
import { QUERY_KEYS } from "app/constants";

interface UnhideProductParams {
  productId: string;
  variantId: string | null;
  productTitle?: string;
}

async function unhideProduct({ productId, variantId }: UnhideProductParams) {
  const formData = new FormData();
  formData.append("productId", productId);
  if (variantId) formData.append("variantId", variantId);

  await fetch("/settings/unhide-product", {
    method: "POST",
    body: formData,
  });

  return { productId, variantId };
}

export function useUnhideProductsMutation() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<
    { productId: string; variantId: string | null },
    Error,
    UnhideProductParams
  >({
    mutationFn: unhideProduct,
    onSuccess: (_, variables) => {
      showToast({
        content: `${variables.productTitle || "Product"} will now appear in insights again.`,
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hiddenProducts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productInsights });
    },
    onError: (error) => {
      showToast({
        content: `Error removing product: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: true,
      });
    },
  });
}

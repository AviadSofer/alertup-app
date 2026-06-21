import { HiddenProductsTable } from "./HiddenProductsTable";
import { useHiddenProductsQuery } from "../hooks/use-hidden-products.query";
import { useUnhideProductsMutation } from "app/hooks/use-unhide-products.mutation";
import { LoadingSpinner } from "./LoadingSpinner";

export function HiddenProductsPanel() {
  const { data: hiddenProducts, isFetching } = useHiddenProductsQuery();

  const hiddenProductsMutation = useUnhideProductsMutation();

  if (isFetching) {
    return <LoadingSpinner text="Loading hidden products..." />;
  }

  const handleDelete = (productId: string, variantId: string | null) => {
    const product = hiddenProducts?.find(
      (p) => p.productId === productId && p.variantId === variantId,
    );
    hiddenProductsMutation.mutate({
      productId,
      variantId,
      productTitle: product?.productTitle,
    });
  };

  return (
    <HiddenProductsTable
      hiddenProducts={hiddenProducts || []}
      onDelete={handleDelete}
    />
  );
}

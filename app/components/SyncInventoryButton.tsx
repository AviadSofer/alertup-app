import { Button } from "@shopify/polaris";
import { RefreshIcon } from "@shopify/polaris-icons";
import { useSyncInventoryMutation } from "../hooks/use-sync-inventory.mutation";
import { useToast } from "./Toast";

export function SyncInventoryButton() {
  const { showToast } = useToast();

  const { mutate: syncInventory, isPending } = useSyncInventoryMutation({
    onSuccess: (data) => {
      showToast({
        content: data.message || "Inventory data synchronized successfully",
      });
    },
    onError: (error) => {
      showToast({
        content: `Error syncing inventory: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: true,
      });
    },
  });

  const handleSync = () => {
    syncInventory();
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "16px",
        marginBottom: "16px",
      }}
    >
      <Button
        variant="primary"
        loading={isPending}
        disabled={isPending}
        onClick={handleSync}
        icon={RefreshIcon}
        size="large"
      >
        Sync Inventory Data
      </Button>
    </div>
  );
}

import { useMutation } from "@tanstack/react-query";

interface SyncInventoryResponse {
  success: boolean;
  message?: string;
  error?: string;
  updatedItemsCount?: number;
}

async function syncInventory(): Promise<SyncInventoryResponse> {
  const response = await fetch("/api/sync-inventory", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to sync inventory: ${response.statusText}`);
  }

  return response.json();
}

interface UseSyncInventoryOptions {
  onSuccess?: (data: SyncInventoryResponse) => void;
  onError?: (error: Error) => void;
}

export function useSyncInventoryMutation(options?: UseSyncInventoryOptions) {
  return useMutation<SyncInventoryResponse, Error>({
    mutationFn: syncInventory,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

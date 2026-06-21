import { useState, useEffect } from "react";
import { Modal, BlockStack } from "@shopify/polaris";
import { VendorPicker } from "./VendorPicker";

interface VendorPickerModalProps {
  open: boolean;
  onClose: () => void;
  vendors: string[];
  initialSelected: string[];
  onSelect: (selected: string[]) => void;
}

export function VendorPickerModal({
  open,
  onClose,
  vendors,
  initialSelected,
  onSelect,
}: VendorPickerModalProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  useEffect(() => {
    if (open) {
      setSelected(initialSelected);
    }
  }, [open, initialSelected]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select vendors"
      primaryAction={{
        content: "Select vendors",
        onAction: () => {
          onSelect(selected);
          onClose();
        },
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <VendorPicker
            vendors={vendors}
            selected={selected}
            onChange={setSelected}
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

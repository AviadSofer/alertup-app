import { useState, useCallback } from "react";
import { Modal, Tabs } from "@shopify/polaris";
import { HiddenProductsPanel } from "./HiddenProductsPanel";
import { OutOfStockPanel } from "./OutOfStockPanel";
import { InventorySyncPanel } from "./InventorySyncPanel";
import { EmailPreferencesPanel } from "./EmailPreferencesPanel";

const TABS = [
  {
    id: "hidden-products",
    content: "Hidden Products",
    accessibilityLabel: "Hidden Products",
    panelID: "hidden-products-panel",
  },
  {
    id: "out-of-stock",
    content: "Out of Stock Insights",
    accessibilityLabel: "Out of Stock Insights",
    panelID: "out-of-stocks-panel",
  },
  {
    id: "inventory-sync",
    content: "Inventory Sync",
    accessibilityLabel: "Inventory Sync",
    panelID: "inventory-sync-panel",
  },
  {
    id: "email-preferences",
    content: "Email Preferences",
    accessibilityLabel: "Email Preferences",
    panelID: "email-preferences-panel",
  },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    [],
  );

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="large">
      <div style={{ minHeight: "60vh" }}>
        <Tabs tabs={TABS} selected={selected} onSelect={handleTabChange}>
          {selected === 0 && (
            <Modal.Section>
              <HiddenProductsPanel />
            </Modal.Section>
          )}

          {selected === 1 && (
            <Modal.Section>
              <OutOfStockPanel />
            </Modal.Section>
          )}

          {selected === 2 && (
            <Modal.Section>
              <InventorySyncPanel />
            </Modal.Section>
          )}

          {selected === 3 && (
            <Modal.Section>
              <EmailPreferencesPanel />
            </Modal.Section>
          )}
        </Tabs>
      </div>
    </Modal>
  );
}

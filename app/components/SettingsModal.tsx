import { useState, useCallback } from "react";
import { Modal, Tabs } from "@shopify/polaris";
import { EmailPreferencesPanel } from "./EmailPreferencesPanel";

const TABS = [
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
              <EmailPreferencesPanel />
            </Modal.Section>
          )}
        </Tabs>
      </div>
    </Modal>
  );
}

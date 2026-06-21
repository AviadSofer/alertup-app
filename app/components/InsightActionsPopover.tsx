import { Button, Popover, ActionList } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { MenuVerticalIcon } from "@shopify/polaris-icons";

interface InsightActionsPopoverProps {
  onHideInsight: () => void;
}

export const InsightActionsPopover = ({
  onHideInsight,
}: InsightActionsPopoverProps) => {
  const [popoverActive, setPopoverActive] = useState(false);

  const togglePopoverActive = useCallback(
    () => setPopoverActive((popoverActive) => !popoverActive),
    [],
  );

  const handleHideInsight = useCallback(() => {
    onHideInsight();
    setPopoverActive(false);
  }, [onHideInsight]);

  const activator = (
    <Button
      variant="plain"
      icon={MenuVerticalIcon}
      onClick={togglePopoverActive}
      accessibilityLabel="More options"
      size="micro"
    />
  );

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      onClose={togglePopoverActive}
      ariaHaspopup={false}
      preferredAlignment="right"
    >
      <ActionList
        actionRole="menuitem"
        items={[
          {
            content: "Don't show insights about this product",
            onAction: handleHideInsight,
          },
        ]}
      />
    </Popover>
  );
};

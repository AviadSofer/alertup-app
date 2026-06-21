import { Tooltip, Icon } from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import type { ReactNode } from "react";

interface StatusInfoProps {
  content: ReactNode;
}

export function StatusInfo({ content }: StatusInfoProps) {
  const tooltipStyle = {
    display: "inline-flex",
    marginLeft: "5px",
    verticalAlign: "middle",
    color: "var(--p-color-text-subdued)",
    cursor: "help",
  };

  return (
    <Tooltip content={content}>
      <span style={tooltipStyle}>
        <Icon source={InfoIcon} />
      </span>
    </Tooltip>
  );
}

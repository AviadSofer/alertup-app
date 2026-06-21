import { type ReactNode, useState, useEffect } from "react";
import { Button, Text } from "@shopify/polaris";
import styles from "./Section.module.css";

interface SectionProps {
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  defaultActionText?: {
    show: string;
    collapse: string;
  };
  defaultCollapsed?: boolean;
}

export function Section({
  title,
  subtitle,
  children,
  action,
  defaultActionText = {
    show: "Show",
    collapse: "Collapse",
  },
  defaultCollapsed = false,
}: SectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Sync state if defaultCollapsed changes (e.g. after localStorage check on client)
  useEffect(() => {
    setIsCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);
  const defaultAction = (
    <Button
      onClick={() => setIsCollapsed(!isCollapsed)}
      variant="monochromePlain"
    >
      {isCollapsed ? defaultActionText.show : defaultActionText.collapse}
    </Button>
  );

  return (
    <div className={styles.section}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div className={styles.sectionTitle}>
            {typeof title === "string" ? (
              <Text variant="headingLg" as="h2">
                {title}
              </Text>
            ) : (
              title
            )}
          </div>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {action || defaultAction}
      </div>
      {!isCollapsed && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
}

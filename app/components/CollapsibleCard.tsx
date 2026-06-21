import { Card } from "@shopify/polaris";
import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyStateAnimation } from "./Animations";
import { LoadingSpinner } from "./LoadingSpinner";
import styles from "./CollapsibleCard.module.css";

interface CollapsibleCardProps {
  children: ReactNode;
  isEmpty?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
}

export function CollapsibleCard({
  children,
  isEmpty = false,
  isLoading = false,
  loadingText = "Loading...",
  emptyStateMessage,
  emptyStateDescription,
}: CollapsibleCardProps) {
  return (
    <Card>
      <div className={styles.container}>
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoadingSpinner text={loadingText} />
            </motion.div>
          ) : isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyStateAnimation
                heading={emptyStateMessage}
                description={emptyStateDescription}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

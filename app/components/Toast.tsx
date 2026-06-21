import { Toast, Frame } from "@shopify/polaris";
import type { ReactNode } from "react";
import { useCallback, useState, createContext, useContext } from "react";

export type ToastProps = {
  content: string;
  error?: boolean;
  onDismiss?: () => void;
};

type ToastContextType = {
  showToast: (props: ToastProps) => void;
  dismissToast: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [toastProps, setToastProps] = useState<ToastProps>({ content: "" });

  const showToast = useCallback((props: ToastProps) => {
    setToastProps(props);
    setActive(true);
  }, []);

  const dismissToast = useCallback(() => {
    setActive(false);
    if (toastProps.onDismiss) {
      toastProps.onDismiss();
    }
  }, [toastProps]);

  const toastMarkup = active ? (
    <Toast
      content={toastProps.content}
      error={toastProps.error}
      onDismiss={dismissToast}
    />
  ) : null;

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      <Frame>
        {children}
        {toastMarkup}
      </Frame>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

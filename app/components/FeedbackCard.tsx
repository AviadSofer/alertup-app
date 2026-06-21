import { useState, useCallback, useEffect } from "react";
import { Icon } from "@shopify/polaris";
import { ClipboardIcon, CheckIcon, XIcon, ChatIcon } from "@shopify/polaris-icons";
import { useHasVisited } from "app/hooks/use-has-visited";

const EMAIL = "aviad@stokow.com";

export function FeedbackCard() {
  const hasVisited = useHasVisited();
  const [open, setOpen] = useState(!hasVisited);
  const [copied, setCopied] = useState(false);

  // Sync state when hasVisited is determined
  useEffect(() => {
    setOpen(!hasVisited);
  }, [hasVisited]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = EMAIL;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={handleToggle}
        aria-label={open ? "Close feedback" : "Send feedback"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: "#303030",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.28)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.2)";
        }}
      >
        <div style={{ width: 24, height: 24 }}>
          <Icon source={open ? XIcon : ChatIcon} />
        </div>
      </button>

      {/* Popup card */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            zIndex: 999,
            width: 320,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 8px 30px rgba(0,0,0,0.16)",
            padding: "20px",
            animation: "feedbackSlideIn 0.2s ease-out",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 15,
              fontWeight: 650,
              color: "#1a1a1a",
            }}
          >
            Missing a feature?
          </p>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 13,
              lineHeight: 1.5,
              color: "#616161",
            }}
          >
            Hey, I'm Aviad, the developer behind Stockup. If you're
            uninstalling because a specific inventory feature is missing, I'd
            love to hear about it so I can build it!
          </p>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Copy email button */}
            <button
              onClick={handleCopy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: copied ? "#1a8a3f" : "#303030",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = "#303030";
                }
              }}
            >
              <div style={{ width: 16, height: 16 }}>
                <Icon source={copied ? CheckIcon : ClipboardIcon} />
              </div>
              {copied ? "Copied!" : "Copy email"}
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes feedbackSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

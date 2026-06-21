import { motion } from "framer-motion";
import { Text } from "@shopify/polaris";

export function EmptyStateAnimation({
  heading = "Looks like everything is under control!",
  description = "Keep up the great work managing your inventory 🚀",
  svg,
}: {
  heading?: string;
  description?: string;
  svg?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", bounce: 0.25 }}
        style={{ display: "inline-block", marginBottom: 16 }}
      >
        {svg || (
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="16" y="20" width="64" height="56" rx="8" fill="#E6FFFA" />
            <rect x="24" y="28" width="48" height="8" rx="2" fill="#38B2AC" />
            <rect x="24" y="40" width="32" height="6" rx="2" fill="#CBD5E0" />
            <rect x="24" y="50" width="40" height="6" rx="2" fill="#CBD5E0" />
            <rect x="24" y="60" width="28" height="6" rx="2" fill="#CBD5E0" />
            <motion.rect
              x="56"
              y="28"
              width="16"
              height="8"
              rx="2"
              fill="#F6AD55"
              animate={{ y: [28, 24, 28] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <motion.path
              d="M40 76C40 76 44 68 48 68C52 68 56 76 56 76"
              stroke="#38B2AC"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ pathLength: [0, 1] }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </svg>
        )}
      </motion.div>
      <Text as="h3" variant="headingMd" tone="subdued">
        {heading}
      </Text>
      <div style={{ marginTop: 8 }}>
        <Text as="p" tone="subdued">
          {description}
        </Text>
      </div>
    </div>
  );
}

export function OnboardingWelcomeAnimation() {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", bounce: 0.25 }}
        style={{
          display: "inline-block",
          marginBottom: 16,
          width: 120,
          height: 120,
          lineHeight: "120px",
        }}
      >
        <motion.span
          style={{
            fontSize: 100,
            display: "inline-block",
            verticalAlign: "middle",
          }}
          animate={{ rotate: [0, 18, -12, 18, 0] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        >
          🖐️
        </motion.span>
      </motion.div>
    </div>
  );
}

export function OnboardingPermissionsAnimation() {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", bounce: 0.25 }}
        style={{ display: "inline-block", marginBottom: 16 }}
      >
        <svg width="120" height="120" viewBox="0 0 96 96" fill="none">
          <rect x="24" y="40" width="48" height="32" rx="8" fill="#FEF9C3" />
          <motion.rect
            x="40"
            y="56"
            width="16"
            height="8"
            rx="4"
            fill="#FACC15"
            animate={{ y: [56, 52, 56] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.circle
            cx="48"
            cy="48"
            r="12"
            fill="#FDE68A"
            animate={{ r: [12, 14, 12] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.path
            d="M48 40 v-8 a8 8 0 0 1 16 0 v8"
            stroke="#F59E42"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            animate={{ pathLength: [0.7, 1, 0.7] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

export function OnboardingPricingAnimation() {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", bounce: 0.25 }}
        style={{ display: "inline-block", marginBottom: 16 }}
      >
        <svg width="120" height="120" viewBox="0 0 96 96" fill="none">
          <motion.circle
            cx="48"
            cy="60"
            r="16"
            fill="#DCFCE7"
            animate={{ cy: [60, 56, 60] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.circle
            cx="64"
            cy="72"
            r="8"
            fill="#4ADE80"
            animate={{ cy: [72, 68, 72] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.3,
            }}
          />
          <motion.circle
            cx="32"
            cy="72"
            r="8"
            fill="#22D3EE"
            animate={{ cy: [72, 68, 72] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.6,
            }}
          />
          <motion.text
            x="48"
            y="65"
            textAnchor="middle"
            fontSize="16"
            fill="#16A34A"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            $
          </motion.text>
        </svg>
      </motion.div>
    </div>
  );
}

export function OnboardingLowStockAnimation() {
  return (
    <div style={{ textAlign: "center", padding: "16px 0 12px" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", bounce: 0.25 }}
        style={{ display: "inline-block", marginBottom: 8 }}
      >
        <svg width="128" height="128" viewBox="0 0 128 128" fill="none">
          <rect x="24" y="28" width="80" height="72" rx="12" fill="#F1F8F5" />
          <rect x="36" y="42" width="42" height="8" rx="4" fill="#95C9B4" />
          <rect x="36" y="58" width="56" height="8" rx="4" fill="#D6E7DF" />
          <rect x="36" y="74" width="44" height="8" rx="4" fill="#D6E7DF" />
          <motion.circle
            cx="94"
            cy="38"
            r="14"
            fill="#FEE2E2"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
          <motion.path
            d="M94 30v10"
            stroke="#B42318"
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ opacity: [1, 0.65, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
          <circle cx="94" cy="46" r="2.5" fill="#B42318" />
          <motion.path
            d="M42 94c9-10 18-10 27 0 9 10 18 10 27 0"
            stroke="#2A7C6F"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

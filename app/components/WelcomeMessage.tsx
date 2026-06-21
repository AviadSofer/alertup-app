import { Section } from "./Section";
import { CollapsibleCard } from "./CollapsibleCard";
import { Text, Link } from "@shopify/polaris";
import { useHasVisited } from "app/hooks/use-has-visited";
export function WelcomeMessage() {
  const hasVisited = useHasVisited();

  return (
    <Section
      title="✨ Welcome to Stockup"
      defaultActionText={{
        show: "View Welcome Message",
        collapse: "Collapse Welcome Message",
      }}
      defaultCollapsed={hasVisited}
    >
      <CollapsibleCard>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div>
            <Text variant="headingMd" as="h3">
              Smarter inventory management, built right into your Shopify
              dashboard.
              <br />
              We'll show you what needs attention each day, what to restock, and
              where your inventory stands.
              <br />
              You'll receive daily product insights and real-time inventory
              alerts. You can change these settings at any time.
            </Text>
          </div>
          <div style={{ margin: "8px 0", textAlign: "left" }}>
            <Text as="p" tone="subdued" variant="bodyLg">
              📊 Based on your last 30 days of orders and stock activity.
              <br />
              💡 We're just getting started and would love your feedback.
              <br />
              🛟 Need help? Reach out anytime.
            </Text>
          </div>
          <div style={{ textAlign: "left" }}>
            <Text as="p" variant="bodyLg">
              We value feedback! It helps us make our product better and keeps
              us energized.
              <br />
              Let us know how we're doing.{" "}
              <Link
                url="https://apps.shopify.com/stockup#modal-show=WriteReviewModal"
                target="_blank"
              >
                Leave a review
              </Link>
            </Text>
          </div>
        </div>
      </CollapsibleCard>
    </Section>
  );
}

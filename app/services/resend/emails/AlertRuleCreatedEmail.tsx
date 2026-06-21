import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface AlertRuleCreatedEmailProps {
  shopDomain: string;
  threshold: number;
  dashboardLink: string;
}

export default function AlertRuleCreatedEmail({
  shopDomain,
  threshold,
  dashboardLink,
}: AlertRuleCreatedEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <title>Low-stock alerts are active</title>
      </Head>
      <Preview>Stockup is now monitoring low stock for {shopDomain}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <Text style={eyebrow}>Stockup</Text>
            <Heading style={heading}>Low-stock alerts are active</Heading>
            <Text style={bodyText}>
              Stockup will email you when a variant reaches {threshold} units or
              less. We will not send the same alert again until inventory is
              restocked and drops below the threshold again.
            </Text>
            <Link href={dashboardLink} style={button}>
              View alerts in Stockup
            </Link>
          </Section>
          <Text style={footer}>
            You are receiving this because a low-stock alert was created for{" "}
            {shopDomain}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f6f6f4",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "40px 0",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: "560px",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "32px",
};

const eyebrow: React.CSSProperties = {
  color: "#2a7c6f",
  fontSize: "13px",
  fontWeight: 700,
  margin: "0 0 12px",
  textTransform: "uppercase",
};

const heading: React.CSSProperties = {
  color: "#111827",
  fontSize: "24px",
  lineHeight: "1.25",
  margin: "0 0 16px",
};

const bodyText: React.CSSProperties = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#2a7c6f",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 700,
  padding: "12px 20px",
  textDecoration: "none",
};

const footer: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "16px 0 0",
  textAlign: "center",
};

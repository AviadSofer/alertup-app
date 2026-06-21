import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Section,
  Text,
  Hr,
  Preview,
  Img,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  userName: string;
  dashboardLink: string;
  unsubscribeLink: string;
}

export const WelcomeEmail = ({
  userName,
  dashboardLink,
  unsubscribeLink,
}: WelcomeEmailProps) => {
  return (
    <Html lang="en">
      <Head>
        <title>Welcome to Stockup</title>
      </Head>
      <Preview>Welcome to Stockup — your smarter inventory dashboard</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          {/* Branded Header */}
          <Section style={header}>
            <Img
              src="https://stokow.com/stockup-logo.svg"
              width="150"
              height="40"
              alt="Stockup"
              style={logoImage}
            />
          </Section>

          {/* Hero Section */}
          <Section style={card}>
            <Heading style={heroHeading}>Welcome aboard, {userName}!</Heading>
            <Text style={heroSubtext}>
              We're thrilled to have you. Stockup helps you stay on top of your
              inventory with smart insights, alerts, and reorder suggestions — so
              you never miss a sale.
            </Text>

            <Hr style={divider} />

            {/* Feature Highlights */}
            <Heading style={sectionHeading}>Here's what you can do</Heading>

            <table width="100%" cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <td style={featureCard}>
                    <Text style={featureTitle}>Real-time Tracking</Text>
                    <Text style={featureDesc}>
                      Monitor inventory levels across all your products in real time.
                    </Text>
                  </td>
                </tr>
                <tr><td style={{ height: "12px" }} /></tr>
                <tr>
                  <td style={featureCard}>
                    <Text style={featureTitle}>Smart Alerts</Text>
                    <Text style={featureDesc}>
                      Get notified before stock runs out — no more missed sales.
                    </Text>
                  </td>
                </tr>
                <tr><td style={{ height: "12px" }} /></tr>
                <tr>
                  <td style={featureCard}>
                    <Text style={featureTitle}>Reorder Insights</Text>
                    <Text style={featureDesc}>
                      Data-driven reorder suggestions based on your last 30 days of sales.
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link href={dashboardLink} style={ctaButton}>
                Go to Dashboard →
              </Link>
            </Section>

            {/* Tip Section */}
            <Section style={tipBox}>
              <Text style={tipText}>
                <strong>Tip:</strong> You'll receive daily insights emails about
                your store's performance. Keep an eye on your inbox!
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerBrand}>— The Stockup Team</Text>
            <Text style={footerTagline}>
              Helping you stay in stock, effortlessly.
            </Text>
            <Hr style={footerDivider} />
            <Text style={footerLinks}>
              <Link href={dashboardLink} style={footerLink}>
                Dashboard
              </Link>
              &nbsp;&nbsp;•&nbsp;&nbsp;
              <Link href={unsubscribeLink} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

/* ─── Styles ─── */

const main: React.CSSProperties = {
  backgroundColor: "#f4f2ef",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0",
  padding: "40px 0",
};

const wrapper: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
};

const header: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px 12px 0 0",
  padding: "32px 0 20px",
  textAlign: "center",
};

const logoImage: React.CSSProperties = {
  margin: "0 auto",
  display: "inline-block",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "36px 32px",
};

const heroHeading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 12px",
};

const heroSubtext: React.CSSProperties = {
  fontSize: "15px",
  color: "#555555",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const divider: React.CSSProperties = {
  borderColor: "#eee",
  margin: "28px 0",
};

const sectionHeading: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 20px",
};

const featureCard: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderRadius: "10px",
  padding: "20px",
  border: "1px solid #f0f0f0",
};



const featureTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "4px 0 4px",
};

const featureDesc: React.CSSProperties = {
  fontSize: "13px",
  color: "#777",
  margin: "0",
  lineHeight: "1.5",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  padding: "32px 0 24px",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#2a7c6f",
  color: "#ffffff",
  padding: "14px 36px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "700",
  fontSize: "15px",
  display: "inline-block",
};

const tipBox: React.CSSProperties = {
  backgroundColor: "#f0faf8",
  borderRadius: "8px",
  padding: "16px 20px",
  borderLeft: "4px solid #2a7c6f",
};

const tipText: React.CSSProperties = {
  fontSize: "13px",
  color: "#555",
  margin: "0",
  lineHeight: "1.6",
};

const footer: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 12px 12px",
  padding: "24px 32px",
  borderTop: "1px solid #f0f0f0",
  textAlign: "center",
};

const footerBrand: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#333",
  margin: "0 0 4px",
};

const footerTagline: React.CSSProperties = {
  fontSize: "12px",
  color: "#999",
  margin: "0 0 16px",
};

const footerDivider: React.CSSProperties = {
  borderColor: "#eee",
  margin: "0 0 16px",
};

const footerLinks: React.CSSProperties = {
  fontSize: "12px",
  color: "#999",
  margin: "0",
};

const footerLink: React.CSSProperties = {
  color: "#2a7c6f",
  textDecoration: "underline",
};

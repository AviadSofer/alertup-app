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

export interface StockAlertEmailProps {
  headline: string;
  productName: string;
  stockStatusDescription: string;
  currentStock: number | string;
  daysLeft: number | string;
  recommendation: string;
  productDashboardLink: string;
  unsubscribeLink?: string;
  backgroundColor?: string;
}

export const StockAlertEmail = ({
  headline,
  productName,
  stockStatusDescription,
  currentStock,
  daysLeft,
  recommendation,
  productDashboardLink,
  unsubscribeLink,
}: StockAlertEmailProps) => {
  // Determine severity colors
  const isUrgent =
    (typeof daysLeft === "number" && daysLeft <= 5) ||
    (typeof daysLeft === "string" && parseInt(daysLeft, 10) <= 5);

  const badgeColor = isUrgent ? "#dc2626" : "#d97706";
  const badgeBg = isUrgent ? "#fef2f2" : "#fffbeb";
  const badgeBorder = isUrgent ? "#fecaca" : "#fde68a";

  return (
    <Html lang="en">
      <Head>
        <title>Inventory Alert — {productName}</title>
      </Head>
      <Preview>
        ⚠️ {productName} is {stockStatusDescription.toLowerCase()} — action
        needed
      </Preview>
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

          {/* Main Card */}
          <Section style={card}>
            {/* Alert Badge */}
            <div style={{ ...alertBanner, backgroundColor: badgeBg, borderColor: badgeBorder }}>
              <Text style={{ ...alertBannerText, color: badgeColor }}>
                Inventory Alert
              </Text>
            </div>

            <Heading style={headingStyle}>{headline}</Heading>
            <Text style={bodyText}>
              Your product <strong>{productName}</strong> is currently{" "}
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                {stockStatusDescription}
              </span>
            </Text>

            {/* Stats Cards */}
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <td style={{ padding: "0 6px 0 0", width: "50%" }}>
                    <div style={statCard}>
                      <Text style={statLabel}>Current Stock</Text>
                      <Text style={statValue}>
                        {currentStock}{" "}
                        <span style={statUnit}>
                          unit
                          {currentStock !== 1 && currentStock !== "1"
                            ? "s"
                            : ""}
                        </span>
                      </Text>
                    </div>
                  </td>
                  <td style={{ padding: "0 0 0 6px", width: "50%" }}>
                    <div style={statCard}>
                      <Text style={statLabel}>Days Left</Text>
                      <Text style={statValue}>
                        {daysLeft}{" "}
                        <span style={statUnit}>
                          day
                          {daysLeft !== 1 && daysLeft !== "1" ? "s" : ""}
                        </span>
                      </Text>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Recommendation */}
            <div style={recommendationBox}>
              <Text style={recommendationText}>
                <strong>Recommendation:</strong> {recommendation}
              </Text>
            </div>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link href={productDashboardLink} style={ctaButton}>
                View in Stockup
              </Link>
            </Section>

            {/* How We Calculate */}
            <Section style={howBox}>
              <Text style={howText}>
                <strong>How do we calculate this?</strong>
                <br />
                These insights are based on your store's last 30 days of order
                activity and current stock levels.
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
            <Text style={footerNote}>
              You're receiving this alert because you're subscribed to inventory
              updates.
            </Text>
            <Text style={footerLinksText}>
              <Link href={productDashboardLink} style={footerLink}>
                Settings
              </Link>
              {unsubscribeLink && (
                <>
                  &nbsp;&nbsp;•&nbsp;&nbsp;
                  <Link href={unsubscribeLink} style={footerLink}>
                    Unsubscribe
                  </Link>
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default StockAlertEmail;

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

const alertBanner: React.CSSProperties = {
  borderRadius: "6px",
  padding: "8px 12px",
  marginBottom: "20px",
  display: "inline-block",
  borderWidth: "1px",
  borderStyle: "solid",
};

const alertBannerText: React.CSSProperties = {
  margin: "0",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 12px",
};

const bodyText: React.CSSProperties = {
  fontSize: "15px",
  color: "#555",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const statCard: React.CSSProperties = {
  borderRadius: "8px",
  padding: "20px 16px",
  textAlign: "center",
  marginBottom: "16px",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
};

const statLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#888",
  margin: "0 0 6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const statValue: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "800",
  color: "#1a1a1a",
  margin: "0",
};

const statUnit: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "400",
  color: "#888",
};

const recommendationBox: React.CSSProperties = {
  borderLeft: "4px solid #2a7c6f",
  backgroundColor: "#f9fafb",
  borderRadius: "0 8px 8px 0",
  padding: "16px 20px",
  marginBottom: "24px",
};

const recommendationText: React.CSSProperties = {
  fontSize: "14px",
  color: "#444",
  margin: "0",
  lineHeight: "1.6",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  padding: "8px 0 28px",
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

const howBox: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  padding: "16px 20px",
  border: "1px solid #f0f0f0",
};

const howText: React.CSSProperties = {
  fontSize: "12px",
  color: "#888",
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
  margin: "0 0 12px",
};

const footerNote: React.CSSProperties = {
  fontSize: "11px",
  color: "#aaa",
  margin: "0 0 8px",
};

const footerLinksText: React.CSSProperties = {
  fontSize: "12px",
  color: "#999",
  margin: "0",
};

const footerLink: React.CSSProperties = {
  color: "#2a7c6f",
  textDecoration: "underline",
};

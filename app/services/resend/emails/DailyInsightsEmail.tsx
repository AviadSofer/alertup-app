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

export interface InsightItem {
  icon?: string;
  color?: string;
  message: string;
}

export interface ReorderItem {
  product: string;
  current_stock: string;
  days_left: string;
  reorder_amount: string;
}

export interface DailyInsightsEmailProps {
  userName: string;
  dashboardLink: string;
  unsubscribeLink: string;
  insights: Record<string, InsightItem> | InsightItem[];
  reorderSummary: Record<string, ReorderItem> | ReorderItem[];
}

export const DailyInsightsEmail = ({
  userName,
  dashboardLink,
  unsubscribeLink,
  insights,
  reorderSummary,
}: DailyInsightsEmailProps) => {
  // Convert map-objects to arrays
  const insightsArray = Array.isArray(insights)
    ? insights
    : Object.keys(insights)
        .filter((key) => key !== "size")
        .map((key) => insights[key as keyof typeof insights]);

  const reorderArray = Array.isArray(reorderSummary)
    ? reorderSummary
    : Object.keys(reorderSummary)
        .filter((key) => key !== "size")
        .map((key) => reorderSummary[key as keyof typeof reorderSummary]);

  return (
    <Html lang="en">
      <Head>
        <title>Daily Inventory Insights</title>
      </Head>
      <Preview>{`Your daily inventory report is ready — ${insightsArray.length} insights today`}</Preview>
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
            <Heading style={heroHeading}>
              Good morning, {userName}!
            </Heading>
            <Text style={heroSubtext}>
              Here's your daily inventory snapshot — {insightsArray.length}{" "}
              insight{insightsArray.length !== 1 ? "s" : ""} today.
            </Text>

            <Hr style={divider} />

            {/* Insights Section */}
            {insightsArray.length > 0 && (
              <>
                <Heading style={sectionHeading}>Today's Insights</Heading>
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tbody>
                    {insightsArray.map((insight, i) => (
                      <React.Fragment key={i}>
                        <tr>
                          <td style={insightRow}>
                            <table width="100%" cellPadding="0" cellSpacing="0">
                              <tbody>
                                <tr>
                                  <td
                                    style={{
                                      width: "24px",
                                      verticalAlign: "top",
                                      paddingTop: "6px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        backgroundColor: insight.color || "#2a7c6f",
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <Text style={insightMessage}>
                                      {insight.message}
                                    </Text>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        {i < insightsArray.length - 1 && (
                          <tr>
                            <td style={{ height: "8px" }} />
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Reorder Summary Table */}
            {reorderArray.length > 0 && (
              <>
                <Heading style={{ ...sectionHeading, marginTop: "32px" }}>
                  Reorder Summary
                </Heading>
                <div style={tableWrapper}>
                  <table
                    width="100%"
                    cellPadding="0"
                    cellSpacing="0"
                    style={tableStyle}
                  >
                    <thead>
                      <tr>
                        <th style={tableHeaderCell}>Product</th>
                        <th style={{ ...tableHeaderCell, textAlign: "center" }}>
                          Stock
                        </th>
                        <th style={{ ...tableHeaderCell, textAlign: "center" }}>
                          Days Left
                        </th>
                        <th style={{ ...tableHeaderCell, textAlign: "center" }}>
                          Reorder Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reorderArray.map((item, i) => (
                        <tr
                          key={i}
                          style={{
                            backgroundColor:
                              i % 2 === 0 ? "#ffffff" : "#fafafa",
                          }}
                        >
                          <td style={tableCellProduct}>{item.product}</td>
                          <td style={tableCellCenter}>{item.current_stock}</td>
                          <td style={tableCellCenter}>{item.days_left}</td>
                          <td style={tableCellCenterBold}>
                            {item.reorder_amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link href={dashboardLink} style={ctaButton}>
                View Full Dashboard →
              </Link>
            </Section>

            {/* Data Source Note */}
            <Section style={tipBox}>
              <Text style={tipText}>
                Based on your store's last 30 days of sales and inventory
                data. We're always improving — your feedback helps us get
                better!
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
            <Text style={footerLinksText}>
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

export default DailyInsightsEmail;

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
  margin: "0 0 16px",
};

const insightRow: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  padding: "14px 16px",
  border: "1px solid #f0f0f0",
};

const insightMessage: React.CSSProperties = {
  fontSize: "14px",
  color: "#444",
  margin: "0",
  lineHeight: "1.5",
};

const tableWrapper: React.CSSProperties = {
  border: "1px solid #e8e8e8",
  borderRadius: "10px",
  overflow: "hidden",
};

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  textAlign: "left",
  fontSize: "13px",
};

const tableHeaderCell: React.CSSProperties = {
  backgroundColor: "#2a7c6f",
  color: "#ffffff",
  padding: "12px 14px",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  textAlign: "left",
};

const tableCellProduct: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "13px",
  color: "#333",
  fontWeight: "600",
  borderBottom: "1px solid #f0f0f0",
};

const tableCellCenter: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "13px",
  color: "#555",
  textAlign: "center",
  borderBottom: "1px solid #f0f0f0",
};

const tableCellCenterBold: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "13px",
  color: "#2a7c6f",
  textAlign: "center",
  fontWeight: "700",
  borderBottom: "1px solid #f0f0f0",
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
  fontSize: "12px",
  color: "#666",
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

const footerLinksText: React.CSSProperties = {
  fontSize: "12px",
  color: "#999",
  margin: "0",
};

const footerLink: React.CSSProperties = {
  color: "#2a7c6f",
  textDecoration: "underline",
};

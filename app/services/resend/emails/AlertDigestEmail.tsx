import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

export interface AlertDigestEmailProps {
  shopDomain: string;
  ruleName: string;
  dashboardLink: string;
  unsubscribeLink: string;
  items: Array<{
    productTitle: string;
    variantTitle?: string | null;
    sku?: string | null;
    currentStock: number;
    threshold: number;
    reorderQty?: number | null;
  }>;
}

export const AlertDigestEmail = ({
  shopDomain,
  ruleName,
  dashboardLink,
  unsubscribeLink,
  items,
}: AlertDigestEmailProps) => {
  return (
    <Html lang="en">
      <Head>
        <title>Low Stock Alert - {shopDomain}</title>
      </Head>
      <Preview>
        {`${items.length} product${
          items.length === 1 ? "" : "s"
        } below threshold for ${ruleName}`}
      </Preview>
      <Body style={main}>
        <Container style={wrapper}>
          <Section style={header}>
            <Img
              src="https://stokow.com/stockup-logo.svg"
              width="150"
              height="40"
              alt="Stockup"
              style={logoImage}
            />
          </Section>

          <Section style={card}>
            <Text style={eyebrow}>Low Stock Alert - {shopDomain}</Text>
            <Heading style={heroHeading}>{ruleName}</Heading>
            <Text style={heroSubtext}>
              The following products are below your alert threshold.
            </Text>

            <Hr style={divider} />

            <div style={tableWrapper}>
              <table width="100%" cellPadding="0" cellSpacing="0" style={table}>
                <thead>
                  <tr>
                    <th style={tableHeaderCell}>Product</th>
                    <th style={tableHeaderCell}>Variant</th>
                    <th style={tableHeaderCell}>SKU</th>
                    <th style={tableHeaderCellCenter}>Stock</th>
                    <th style={tableHeaderCellCenter}>Threshold</th>
                    <th style={tableHeaderCellCenter}>Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const statusColor =
                      item.currentStock === 0 ? "#dc2626" : "#d97706";
                    const statusBg =
                      item.currentStock === 0 ? "#fef2f2" : "#fffbeb";

                    return (
                      <tr
                        key={`${item.productTitle}-${item.variantTitle ?? index}`}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#fafafa",
                        }}
                      >
                        <td style={tableCellProduct}>{item.productTitle}</td>
                        <td style={tableCell}>{item.variantTitle || "-"}</td>
                        <td style={tableCell}>{item.sku || "-"}</td>
                        <td style={tableCellCenter}>
                          <span
                            style={{
                              ...stockBadge,
                              backgroundColor: statusBg,
                              color: statusColor,
                            }}
                          >
                            {item.currentStock}
                          </span>
                        </td>
                        <td style={tableCellCenter}>{item.threshold}</td>
                        <td style={tableCellCenterBold}>
                          {item.reorderQty ?? "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Section style={buttonContainer}>
              <Link href={dashboardLink} style={ctaButton}>
                View Alert Rules
              </Link>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerBrand}>- The Stockup Team</Text>
            <Text style={footerTagline}>
              Helping you stay in stock, effortlessly.
            </Text>
            <Hr style={footerDivider} />
            <Text style={footerLinksText}>
              <Link href={dashboardLink} style={footerLink}>
                Dashboard
              </Link>
              &nbsp;&nbsp;|&nbsp;&nbsp;
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

export default AlertDigestEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f4f2ef",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0",
  padding: "40px 0",
};

const wrapper: React.CSSProperties = {
  maxWidth: "680px",
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

const eyebrow: React.CSSProperties = {
  color: "#2a7c6f",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0",
  margin: "0 0 8px",
  textTransform: "uppercase",
};

const heroHeading: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const heroSubtext: React.CSSProperties = {
  color: "#555",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "28px 0",
};

const tableWrapper: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
};

const table: React.CSSProperties = {
  borderCollapse: "collapse",
  fontSize: "13px",
};

const tableHeaderCell: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
  fontWeight: "700",
  padding: "12px 10px",
  textAlign: "left",
};

const tableHeaderCellCenter: React.CSSProperties = {
  ...tableHeaderCell,
  textAlign: "center",
};

const tableCell: React.CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
  color: "#4b5563",
  padding: "12px 10px",
  verticalAlign: "middle",
};

const tableCellProduct: React.CSSProperties = {
  ...tableCell,
  color: "#111827",
  fontWeight: "600",
};

const tableCellCenter: React.CSSProperties = {
  ...tableCell,
  textAlign: "center",
};

const tableCellCenterBold: React.CSSProperties = {
  ...tableCellCenter,
  color: "#111827",
  fontWeight: "700",
};

const stockBadge: React.CSSProperties = {
  borderRadius: "999px",
  display: "inline-block",
  fontWeight: "700",
  minWidth: "28px",
  padding: "3px 8px",
};

const buttonContainer: React.CSSProperties = {
  marginTop: "30px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#2a7c6f",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "12px 22px",
  textDecoration: "none",
};

const footer: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 12px 12px",
  padding: "24px 32px 32px",
  textAlign: "center",
};

const footerBrand: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const footerTagline: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0",
};

const footerDivider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const footerLinksText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0",
};

const footerLink: React.CSSProperties = {
  color: "#2a7c6f",
  textDecoration: "underline",
};

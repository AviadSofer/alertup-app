import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams, useSubmit } from 'react-router';
import {
  Badge,
  BlockStack,
  Box,
  Card,
  Divider,
  IndexTable,
  InlineStack,
  Layout,
  Page,
  Pagination,
  Select,
  Text,
} from "@shopify/polaris";
import { motion } from "framer-motion";

import { authenticate } from "app/shopify.server";
import { getAlertLogsForShop } from "app/services/alert-rules/alert-log.service.server";
import { getShopIdByDomain } from "app/services/alert-rules/alert-rule.service.server";
import { formatRelativeDate } from "app/lib/alert-rule-display";
import { EmptyStateAnimation } from "../components/Animations";
import styles from "../components/AlertHistory.module.css";

const limit = 25;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = await getShopIdByDomain(session.shop);
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const range = url.searchParams.get("range") ?? "30";
  const mode = url.searchParams.get("mode") ?? "all";

  if (!shopId) {
    return {
      result: {
        logs: [],
        page: 1,
        limit,
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      range,
      mode,
    };
  }

  return {
    result: await getAlertLogsForShop(shopId, {
      page,
      limit,
      dateFrom: getDateFromRange(range),
    }),
    range,
    mode,
  };
};

export default function AlertHistoryPage() {
  const { result, range, mode } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const allLogs = result.logs.filter((log): log is NonNullable<typeof log> =>
    Boolean(log),
  );

  // Client-side delivery mode filter
  const logs =
    mode === "all"
      ? allLogs
      : allLogs.filter((log) => log.deliveryMode === mode);

  const handleFilterChange = (key: string, value: string) => {
    const params: Record<string, string> = {
      range,
      mode,
      page: "1",
      [key]: value,
    };
    submit(params, { method: "get", replace: true });
  };

  const goToPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    navigate(`/app/alerts/history?${next.toString()}`);
  };

  const emptyStateMarkup = (
    <EmptyStateAnimation
      heading="No alerts sent yet"
      description="When a rule triggers, you'll see the alert history here."
      svg={<HistoryEmptyIllustration />}
    />
  );

  const filteredEmptyMarkup =
    allLogs.length > 0 && logs.length === 0 ? (
      <EmptyStateAnimation
        heading="No matching alerts"
        description="Try adjusting your filters to see more results."
        svg={<FilterEmptyIllustration />}
      />
    ) : null;

  return (
    <Page
      title="Alert History"
      backAction={{
        content: "Alert Rules",
        onAction: () => navigate("/app/alerts"),
      }}
    >
      <Layout>
        <Layout.Section>
          <div className={styles.tableContainer}>
            <Card padding="0">
              <Box padding="400" paddingBlockEnd="300">
                <InlineStack align="space-between" blockAlign="end">
                  <InlineStack gap="400">
                    <Select
                      label="Date range"
                      options={[
                        { label: "Today", value: "today" },
                        { label: "Last 7 days", value: "7" },
                        { label: "Last 30 days", value: "30" },
                        { label: "Last 90 days", value: "90" },
                      ]}
                      value={range}
                      onChange={(v) => handleFilterChange("range", v)}
                    />
                    <Select
                      label="Delivery mode"
                      options={[
                        { label: "All modes", value: "all" },
                        { label: "Instant", value: "instant" },
                        { label: "Digest", value: "digest" },
                      ]}
                      value={mode}
                      onChange={(v) => handleFilterChange("mode", v)}
                    />
                  </InlineStack>
                  <Text as="span" tone="subdued" variant="bodySm">
                    {logs.length === result.total
                      ? `${result.total} alert${result.total === 1 ? "" : "s"}`
                      : `${logs.length} of ${result.total} alerts`}
                  </Text>
                </InlineStack>
              </Box>

              <Divider />

              <IndexTable
                resourceName={{ singular: "alert", plural: "alerts" }}
                itemCount={logs.length}
                selectable={false}
                headings={[
                  { title: "Date" },
                  { title: "Rule" },
                  { title: "Product" },
                  { title: "Current stock" },
                  { title: "Threshold" },
                  { title: "Reorder qty" },
                  { title: "Recipients" },
                  { title: "Mode" },
                ]}
                emptyState={filteredEmptyMarkup ?? emptyStateMarkup}
              >
                {logs.map((log, index) => (
                  <IndexTable.Row id={log.id} key={log.id} position={index}>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodySm">
                        {formatRelativeDate(log.sentAt)}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      {log.ruleName ? (
                        <Badge tone="info">{log.ruleName}</Badge>
                      ) : (
                        <Text as="span" tone="subdued">
                          Deleted rule
                        </Text>
                      )}
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <BlockStack gap="050">
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          {log.productTitle}
                        </Text>
                        {log.variantTitle ? (
                          <Text as="span" tone="subdued" variant="bodySm">
                            {log.variantTitle}
                          </Text>
                        ) : null}
                      </BlockStack>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Badge tone="critical">
                        {String(log.currentStock)}
                      </Badge>
                    </IndexTable.Cell>
                    <IndexTable.Cell>{log.threshold}</IndexTable.Cell>
                    <IndexTable.Cell>{log.reorderQty ?? "—"}</IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" variant="bodySm">
                        {formatRecipients(log.recipientEmails)}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Badge
                        tone={
                          log.deliveryMode === "instant"
                            ? "attention"
                            : "info"
                        }
                      >
                        {log.deliveryMode === "instant" ? "Instant" : "Digest"}
                      </Badge>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            </Card>
          </div>
        </Layout.Section>

        {(result.hasPreviousPage || result.hasNextPage) && (
          <Layout.Section>
            <InlineStack align="center">
              <Pagination
                hasPrevious={result.hasPreviousPage}
                onPrevious={() => goToPage(result.page - 1)}
                hasNext={result.hasNextPage}
                onNext={() => goToPage(result.page + 1)}
              />
            </InlineStack>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRecipients(emails: string) {
  const list = emails.split(",").map((e) => e.trim());
  if (list.length <= 1) return emails;
  return `${list[0]} +${list.length - 1}`;
}

function getDateFromRange(range: string) {
  const now = new Date();

  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const days = Number(range);
  if (!Number.isFinite(days)) return null;

  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/* ------------------------------------------------------------------ */
/*  Illustrations                                                      */
/* ------------------------------------------------------------------ */

function HistoryEmptyIllustration() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect x="20" y="24" width="56" height="48" rx="10" fill="#EFF6FF" />
      <motion.path
        d="M48 36 L48 48 L56 52"
        stroke="#93C5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{ pathLength: [0, 1] }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <circle cx="48" cy="48" r="16" stroke="#93C5FD" strokeWidth="2" fill="none" />
      <motion.circle
        cx="68"
        cy="32"
        r="8"
        fill="#FEF3C7"
        animate={{ r: [8, 10, 8] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      />
      <path
        d="M65 32h6M68 29v6"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterEmptyIllustration() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect x="20" y="24" width="56" height="48" rx="10" fill="#F5F3FF" />
      <motion.path
        d="M34 38h28L52 52v8l-8 4v-12L34 38z"
        fill="#C4B5FD"
        stroke="#8B5CF6"
        strokeWidth="1.5"
        strokeLinejoin="round"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.circle
        cx="64"
        cy="60"
        r="10"
        fill="#FEE2E2"
        animate={{ r: [10, 12, 10] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      />
      <path
        d="M61 57l6 6M67 57l-6 6"
        stroke="#EF4444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

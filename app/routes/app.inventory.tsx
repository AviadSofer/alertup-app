import { useLoaderData, useRouteError, useSubmit, useNavigation, useSearchParams } from 'react-router';
import {
  Page,
  Layout,
  Banner,
  Button,
  ButtonGroup,
  InlineStack,
  Text,
  Tooltip,
} from "@shopify/polaris";
import type { ProductInventory } from "../models/inventory-analysis.server";
import {
  getProductInventoryAnalysis,
  getReorderDaysFromRequest,
} from "../models/inventory-analysis.server";
import { InventoryAnalysisTable } from "../components/InventoryAnalysisTable";
import { Footer } from "../components/Footer";
import { authenticate } from "app/shopify.server";
import { REORDER_PERIOD_OPTIONS, SALES_PERIOD_OPTIONS } from "app/constants";
import { isPivotPlaceholderEnabled } from "app/lib/feature-toggles";

export const loader = async ({
  request,
}: {
  request: Request;
}): Promise<{
  productInventoryAnalysis: ProductInventory[];
  days: number;
  historyDays: number;
}> => {
  const days = getReorderDaysFromRequest(request);

  const url = new URL(request.url);
  const historyDaysParam = url.searchParams.get("historyDays");
  const historyDays =
    historyDaysParam && !isNaN(parseInt(historyDaysParam, 10))
      ? parseInt(historyDaysParam, 10)
      : 30;

  if (isPivotPlaceholderEnabled()) {
    return {
      productInventoryAnalysis: [],
      days,
      historyDays,
    };
  }

  const { admin, session } = await authenticate.admin(request);

  const productInventoryAnalysis = await getProductInventoryAnalysis(
    session.shop,
    admin,
    undefined,
    days,
    historyDays,
  );

  return {
    productInventoryAnalysis,
    days,
    historyDays,
  };
};

export default function Inventory() {
  const { productInventoryAnalysis, days, historyDays } =
    useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const handlePeriodChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("days", value);
    next.set("historyDays", historyDays.toString());
    submit(Object.fromEntries(next), { replace: true, method: "get" });
  };

  const handleHistoryDaysChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("days", days.toString());
    next.set("historyDays", value);
    submit(Object.fromEntries(next), { replace: true, method: "get" });
  };

  return (
    <Page>
      <div style={{ paddingBottom: 40 }}>
        <Layout>
          <Layout.Section>
            <div style={{ marginBottom: "24px" }}>
              <InlineStack gap="600" align="start" blockAlign="center">
                <InlineStack gap="300" align="start" blockAlign="center">
                  <Tooltip
                    content="Sets how many days of stock the reorder recommendation should cover."
                    dismissOnMouseOut
                  >
                    <Text
                      as="span"
                      variant="bodyMd"
                      fontWeight="semibold"
                      tone="subdued"
                    >
                      Reorder coverage:
                    </Text>
                  </Tooltip>
                  <ButtonGroup variant="segmented">
                    {REORDER_PERIOD_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        pressed={days.toString() === option.value}
                        onClick={() => handlePeriodChange(option.value)}
                        size="slim"
                      >
                        {option.label.split(" (")[0]}
                      </Button>
                    ))}
                  </ButtonGroup>
                </InlineStack>

                <InlineStack gap="300" align="start" blockAlign="center">
                  <Tooltip
                    content="Sets the lookback window used to calculate sales-based metrics like Daily Rate."
                    dismissOnMouseOut
                  >
                    <Text
                      as="span"
                      variant="bodyMd"
                      fontWeight="semibold"
                      tone="subdued"
                    >
                      Sales analysis:
                    </Text>
                  </Tooltip>
                  <ButtonGroup variant="segmented">
                    {SALES_PERIOD_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        pressed={historyDays.toString() === option.value}
                        onClick={() => handleHistoryDaysChange(option.value)}
                        size="slim"
                      >
                        {option.label === "Last month"
                          ? "30 Days"
                          : option.label === "Last 3 months"
                            ? "90 Days"
                            : "14 Days"}
                      </Button>
                    ))}
                  </ButtonGroup>
                </InlineStack>
              </InlineStack>
            </div>

            <InventoryAnalysisTable
              productInventoryAnalysis={productInventoryAnalysis}
              isLoading={navigation.state === "loading"}
              inventoryDaysForStatus={days}
            />
          </Layout.Section>

          <Layout.Section>
            <Footer />
          </Layout.Section>
        </Layout>
      </div>
    </Page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Inventory Route Error:", error);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Banner title="Error loading inventory data" tone="critical">
            <p>
              There was an issue connecting to Shopify to fetch your inventory
              data. Please refresh the page or try again later.
            </p>
          </Banner>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

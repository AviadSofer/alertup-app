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
import {
  getProductInventoryAnalysis,
  getReorderDaysFromRequest,
} from "../models/inventory-analysis.server";
import { ReorderTable } from "../components/ReorderTable";
import type { ReorderProduct } from "../models/reorder-analysis.server";
import { getReorderList } from "../models/reorder-analysis.server";
import { Footer } from "../components/Footer";
import { authenticate } from "app/shopify.server";
import { REORDER_PERIOD_OPTIONS } from "app/constants";
import { isPivotPlaceholderEnabled } from "app/lib/feature-toggles";

export const loader = async ({
  request,
}: {
  request: Request;
}): Promise<{
  reorderData: ReorderProduct[];
  days: number;
}> => {
  const days = getReorderDaysFromRequest(request);

  if (isPivotPlaceholderEnabled()) {
    return {
      reorderData: [],
      days,
    };
  }

  const { admin, session } = await authenticate.admin(request);

  const productInventoryAnalysis = await getProductInventoryAnalysis(
    session.shop,
    admin,
    undefined,
    days,
  );

  const activeProducts = productInventoryAnalysis.filter(
    (product) => product.status === "ACTIVE",
  );

  return {
    reorderData: getReorderList(activeProducts),
    days,
  };
};

export default function Reorder() {
  const { reorderData, days } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const handlePeriodChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("days", value);
    submit(Object.fromEntries(next), { replace: true, method: "get" });
  };

  return (
    <Page>
      <div style={{ paddingBottom: 40 }}>
        <Layout>
          <Layout.Section>
            <div style={{ marginBottom: "24px" }}>
              <InlineStack gap="300" align="start" blockAlign="center">
                <Tooltip
                  content="Sets how many days of stock the reorder list should cover."
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
            </div>
            <ReorderTable
              reorderData={reorderData}
              isLoading={navigation.state === "loading"}
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
  console.error("Reorder Route Error:", error);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Banner title="Error loading reorder data" tone="critical">
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

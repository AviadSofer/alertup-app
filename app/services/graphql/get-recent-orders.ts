import { SALES_ANALYSIS_PERIOD_DAYS } from "../../constants";
import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";
import type { ShopifyHttpOptions } from "../shopify/shopify-fetch.service";
import { shopifyFetchService } from "../shopify/shopify-fetch.service";

interface LineItem {
  id: string;
  title: string;
  quantity: number;
  variant: {
    id: string;
    inventoryItem: {
      id: string;
      variant: {
        id: string;
        product: {
          id: string;
        };
      };
    };
  } | null;
}

export interface Order {
  id: string;
  createdAt: string;
  lineItems: {
    edges: Array<{
      node: LineItem;
    }>;
  };
}

interface OrdersQueryResponse {
  data: {
    orders: {
      edges: Array<{ node: Order }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
}

function getRecentOrdersQuery(salesAnalysisDays: number): string {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - salesAnalysisDays);
  const startDateISO = startDate.toISOString();

  return `#graphql
  query($cursor: String) {
    orders(
      first: 250,
      after: $cursor,
      sortKey: CREATED_AT,
      reverse: true,
      query: "created_at:>${startDateISO}"
    ) {
      edges {
        node {
          id
          createdAt
          lineItems(first: 10) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  inventoryItem {
                    id
                    variant {
                      id
                      product {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }`;
}

async function fetchOrdersPage(
  query: string,
  cursor: string | null,
  admin?: AdminApiContext,
  httpOptions?: ShopifyHttpOptions,
): Promise<OrdersQueryResponse> {
  const variables = cursor ? { cursor } : {};

  if (httpOptions) {
    return shopifyFetchService.getShopifyGraphQLByHttp(
      httpOptions.shopifyDomain,
      httpOptions.accessToken,
      query,
      variables,
    );
  }

  if (!admin) {
    throw new Error(
      "You must provide either an admin object or shopifyDomain and accessToken",
    );
  }

  return shopifyFetchService.getShopifyGraphQLByAdmin(admin, query, variables);
}

export async function getRecentOrders(
  admin?: AdminApiContext,
  httpOptions?: ShopifyHttpOptions,
  salesAnalysisDays: number = SALES_ANALYSIS_PERIOD_DAYS,
): Promise<Order[]> {
  const query = getRecentOrdersQuery(salesAnalysisDays);
  const allOrders: Order[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  const MAX_PAGES = 20; // 20 * 250 = 5,000 orders max
  let pagesFetched = 0;

  try {
    while (hasNextPage && pagesFetched < MAX_PAGES) {
      const json = await fetchOrdersPage(query, cursor, admin, httpOptions);
      const { edges, pageInfo } = json.data.orders;

      allOrders.push(...edges.map(({ node }) => node));

      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
      pagesFetched++;
    }
  } catch (error) {
    console.error(
      `[GraphQL Error] Failed to fetch all orders. Returning ${allOrders.length} records.`,
      error,
    );
  }

  return allOrders;
}

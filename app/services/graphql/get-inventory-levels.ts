import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";
import type { ShopifyHttpOptions } from "../shopify/shopify-fetch.service";
import { shopifyFetchService } from "../shopify/shopify-fetch.service";

export interface InventoryLevel {
  id: string;
  quantities: Array<{
    name: string;
    quantity: number;
  }>;
  location: {
    id: string;
  };
}

export interface InventoryItem {
  id: string;
  inventoryLevels: {
    edges: Array<{
      node: InventoryLevel;
    }>;
  };
  variant: {
    id: string;
    title: string;
    sku: string | null;
    product: {
      id: string;
      title: string;
      vendor: string;
      collections: {
        edges: Array<{
          node: {
            id: string;
            title: string;
          };
        }>;
      };
    };
  };
}

interface InventoryItemsQueryResponse {
  data: {
    inventoryItems: {
      edges: Array<{ node: InventoryItem }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
}

const INVENTORY_LEVELS_QUERY = `#graphql
query($cursor: String) {
  inventoryItems(first: 250, after: $cursor) {
    edges {
      node {
        id
        inventoryLevels(first: 10) {
          edges {
            node {
              id
              quantities(names: ["available"]) {
                name
                quantity
              }
              location {
                id
              }
            }
          }
        }
        variant {
          id
          title
          sku
          product {
            id
            title
            vendor
            collections(first: 250) {
              edges {
                node {
                  id
                  title
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

async function fetchInventoryLevelsPage(
  cursor: string | null,
  admin?: AdminApiContext,
  httpOptions?: ShopifyHttpOptions,
): Promise<InventoryItemsQueryResponse> {
  const variables = cursor ? { cursor } : {};

  if (httpOptions) {
    return shopifyFetchService.getShopifyGraphQLByHttp(
      httpOptions.shopifyDomain,
      httpOptions.accessToken,
      INVENTORY_LEVELS_QUERY,
      variables,
    );
  }

  if (!admin) {
    throw new Error(
      "You must provide either an admin object or shopifyDomain and accessToken",
    );
  }

  return shopifyFetchService.getShopifyGraphQLByAdmin(
    admin,
    INVENTORY_LEVELS_QUERY,
    variables,
  );
}

export async function getInventoryLevels(
  admin?: AdminApiContext,
  httpOptions?: ShopifyHttpOptions,
): Promise<InventoryItem[]> {
  const allInventoryItems: InventoryItem[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  const MAX_PAGES = 20; // 20 * 250 = 5,000 items max
  let pagesFetched = 0;

  try {
    while (hasNextPage && pagesFetched < MAX_PAGES) {
      const json = await fetchInventoryLevelsPage(cursor, admin, httpOptions);
      const { edges, pageInfo } = json.data.inventoryItems;

      allInventoryItems.push(...edges.map(({ node }) => node));

      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
      pagesFetched++;
    }
  } catch (error) {
    console.error(
      `[GraphQL Error] Failed to fetch all inventory items. Returning ${allInventoryItems.length} records.`,
      error,
    );
  }

  return allInventoryItems;
}

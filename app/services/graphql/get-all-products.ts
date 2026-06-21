import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";
import type { ShopifyHttpOptions } from "../shopify/shopify-fetch.service";
import { shopifyFetchService } from "../shopify/shopify-fetch.service";

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export interface ProductVariant {
  id: string;
  title: string;
  inventoryItem: {
    id: string;
  };
}

export interface Product {
  id: string;
  title: string;
  status: ProductStatus;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  variants: {
    edges: Array<{
      node: ProductVariant;
    }>;
  };
}

interface ProductsQueryResponse {
  data: {
    products: {
      edges: Array<{ node: Product }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
}

const PRODUCTS_QUERY = `#graphql
query($cursor: String) {
  products(first: 250, after: $cursor) {
    edges {
      node {
        id
        title
        status
        featuredImage {
          url
          altText
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              inventoryItem {
                id
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

async function fetchProductsPage(
  cursor: string | null,
  admin?: AdminApiContext,
  httpOptions?: ShopifyHttpOptions,
): Promise<ProductsQueryResponse> {
  const variables = cursor ? { cursor } : {};

  if (httpOptions) {
    return shopifyFetchService.getShopifyGraphQLByHttp(
      httpOptions.shopifyDomain,
      httpOptions.accessToken,
      PRODUCTS_QUERY,
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
    PRODUCTS_QUERY,
    variables,
  );
}

export async function getAllProducts(
  admin?: AdminApiContext,
  httpOptions?: ShopifyHttpOptions,
): Promise<Product[]> {
  const allProducts: Product[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  const MAX_PAGES = 20; // 20 * 250 = 5,000 products max
  let pagesFetched = 0;

  try {
    while (hasNextPage && pagesFetched < MAX_PAGES) {
      const json = await fetchProductsPage(cursor, admin, httpOptions);
      const { edges, pageInfo } = json.data.products;

      allProducts.push(...edges.map(({ node }) => node));

      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
      pagesFetched++;
    }
  } catch (error) {
    console.error(
      `[GraphQL Error] Failed to fetch all products. Returning ${allProducts.length} records.`,
      error,
    );
  }

  return allProducts;
}

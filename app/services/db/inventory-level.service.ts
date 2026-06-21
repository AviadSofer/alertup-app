import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";
import db from "../../db.server";
import { getInventoryLevels } from "../graphql/get-inventory-levels";
import { getShopByDomain } from "./shop.service";
import { shopifyFetchService, TransientApiError } from "../shopify/shopify-fetch.service";

const GET_PRODUCT_INFO_BY_INVENTORY_ITEM_QUERY = `#graphql
query GetProductInfoByInventoryItem($id: ID!) {
  inventoryItem(id: $id) {
    id
    variant {
      id
      title
      sku
      image {
        url
      }
      product {
        id
        title
        vendor
        featuredImage {
          url
        }
        collections(first: 250) {
          nodes {
            id
          }
        }
      }
    }
  }
}`;

const GET_PRODUCTS_INFO_BY_INVENTORY_ITEM_IDS_QUERY = `#graphql
query GetProductsInfoByInventoryItemIds($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on InventoryItem {
      id
      variant {
        id
        title
        sku
        image {
          url
        }
        product {
          id
          title
          vendor
          featuredImage {
            url
          }
          collections(first: 250) {
            nodes {
              id
            }
          }
        }
      }
    }
  }
}`;

interface ProductInfoQueryResponse {
  data: {
    inventoryItem: {
      id: string;
      variant: {
        id: string;
        title: string;
        sku: string | null;
        image?: { url: string } | null;
        product: {
          id: string;
          title: string;
          vendor: string;
          featuredImage?: { url: string } | null;
          collections: {
            nodes: Array<{
              id: string;
            }>;
          };
        };
      } | null;
    } | null;
  };
}

interface ProductsInfoBulkQueryResponse {
  data: {
    nodes: Array<{
      id: string;
      variant: {
        id: string;
        title: string;
        sku: string | null;
        image?: { url: string } | null;
        product: {
          id: string;
          title: string;
          vendor: string;
          featuredImage?: { url: string } | null;
          collections: {
            nodes: Array<{
              id: string;
            }>;
          };
        };
      } | null;
    } | null>;
  };
}

export interface InventoryItemProductInfo {
  inventoryItemId: string;
  productId: string;
  productTitle: string;
  variantId?: string;
  variantTitle?: string;
  sku?: string;
  vendor?: string;
  imageUrl?: string;
  collectionIds: string[];
}

export async function upsertInventoryLevels(
  shopDomain: string,
  admin: AdminApiContext,
) {
  const [shop, inventoryLevels] = await Promise.all([
    getShopByDomain(shopDomain),
    getInventoryLevels(admin),
  ]);

  const operations = [];

  for (const item of inventoryLevels) {
    const inventoryItemId = item.id;

    // Process each inventory level for this item
    for (const { node: level } of item.inventoryLevels.edges) {
      const locationId = level.location.id;

      // Find the available quantity from the quantities array
      const availableQuantityObj = level.quantities.find(
        (q) => q.name === "available",
      );
      const availableQuantity = availableQuantityObj
        ? availableQuantityObj.quantity
        : 0;

      // Create an upsert operation for this inventory level
      const operation = db.inventoryLevel.upsert({
        where: {
          shopId_inventoryItemId_locationId: {
            shopId: shop!.id,
            inventoryItemId,
            locationId,
          },
        },
        update: {
          availableQuantity,
          updatedAt: new Date(),
        },
        create: {
          shopId: shop!.id,
          inventoryItemId,
          locationId,
          availableQuantity,
          status: "active",
        },
      });

      operations.push(operation);
    }
  }

  // Execute all operations in a transaction
  return db.$transaction(operations);
}

export async function getInventoryLevelByItemAndLocation(
  inventoryItemId: string,
  locationId: string,
) {
  return db.inventoryLevel.findFirst({
    where: {
      inventoryItemId,
      locationId,
    },
    include: {
      shop: true,
    },
  });
}

export async function updateInventoryLevelQuantity(
  inventoryLevelId: string,
  newAvailableQuantity: number,
) {
  return db.inventoryLevel.update({
    where: {
      id: inventoryLevelId,
    },
    data: {
      availableQuantity: Number(newAvailableQuantity),
      updatedAt: new Date(),
    },
  });
}

/**
 * Get the product name for a single inventory item using a targeted GraphQL query.
 * Uses inventoryItem(id: $id) instead of fetching all items — ~200ms vs 10-30s.
 */
export async function getProductNameByInventoryItemId(
  shopDomain: string,
  accessToken: string,
  inventoryItemId: string,
): Promise<string | null> {
  const productInfo = await getProductInfoByInventoryItemId(
    shopDomain,
    accessToken,
    inventoryItemId,
  );

  return productInfo?.productTitle ?? null;
}

/**
 * Get product, variant, vendor, SKU, and collection data for a single inventory
 * item using a targeted GraphQL query.
 */
export async function getProductInfoByInventoryItemId(
  shopDomain: string,
  accessToken: string,
  inventoryItemId: string,
): Promise<InventoryItemProductInfo | null> {
  try {
    const response =
      await shopifyFetchService.getShopifyGraphQLByHttp<ProductInfoQueryResponse>(
        shopDomain,
        accessToken,
        GET_PRODUCT_INFO_BY_INVENTORY_ITEM_QUERY,
        { id: inventoryItemId },
      );

    const item = response.data?.inventoryItem;
    const variant = item?.variant;
    const product = variant?.product;

    if (!item || !variant || !product) {
      return null;
    }

    return {
      inventoryItemId: item.id,
      productId: product.id,
      productTitle: product.title,
      variantId: variant.id,
      variantTitle: variant.title,
      sku: variant.sku ?? undefined,
      vendor: product.vendor || undefined,
      imageUrl: variant.image?.url ?? product.featuredImage?.url ?? undefined,
      collectionIds: product.collections.nodes.map((collection) => collection.id),
    };
  } catch (error) {
    if (error instanceof TransientApiError) {
      throw error; // Re-throw to trigger webhook retry (500 response)
    }
    console.error(
      `[getProductInfoByInventoryItemId] Failed for item ${inventoryItemId}:`,
      error,
    );
    return null;
  }
}

/**
 * Bulk fetch product information for multiple inventory items in a single query.
 */
export async function getProductsInfoByInventoryItemIds(
  shopDomain: string,
  accessToken: string,
  inventoryItemIds: string[],
): Promise<InventoryItemProductInfo[]> {
  if (inventoryItemIds.length === 0) return [];
  
  try {
    const response =
      await shopifyFetchService.getShopifyGraphQLByHttp<ProductsInfoBulkQueryResponse>(
        shopDomain,
        accessToken,
        GET_PRODUCTS_INFO_BY_INVENTORY_ITEM_IDS_QUERY,
        { ids: inventoryItemIds },
      );

    const nodes = response.data?.nodes || [];
    const results: InventoryItemProductInfo[] = [];

    for (const item of nodes) {
      if (!item) continue;
      const variant = item.variant;
      const product = variant?.product;

      if (!variant || !product) continue;

      results.push({
        inventoryItemId: item.id,
        productId: product.id,
        productTitle: product.title,
        variantId: variant.id,
        variantTitle: variant.title,
        sku: variant.sku ?? undefined,
        vendor: product.vendor || undefined,
        imageUrl: variant.image?.url ?? product.featuredImage?.url ?? undefined,
        collectionIds: product.collections.nodes.map((collection) => collection.id),
      });
    }

    return results;
  } catch (error) {
    console.error(
      `[getProductsInfoByInventoryItemIds] Failed for items:`,
      error,
    );
    return [];
  }
}

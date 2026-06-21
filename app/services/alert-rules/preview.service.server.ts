import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";
import db from "app/db.server";
import { getShopIdByDomain } from "./alert-rule.service.server";
import { getLowStockVariantPreview } from "./dashboard.service.server";

export async function getLivePreview(
  admin: AdminApiContext,
  shop: string,
  scopeType: string,
  scopeValue: string | null,
  threshold: number,
  locationId: string | null
) {
  const shopId = await getShopIdByDomain(shop);
  if (!shopId) return { totalMatching: 0, belowThreshold: 0 };

  // If "all" or no scope value, use our fast local DB preview (optionally filtered by location)
  if (scopeType === "all" || !scopeValue) {
    if (!locationId) {
      return getLowStockVariantPreview(shopId, threshold);
    }
    // Simple local DB query for 'all' products but specific location
    const inventoryRows = await db.inventoryLevel.groupBy({
      by: ["inventoryItemId"],
      where: { shopId, locationId },
      _sum: { availableQuantity: true },
    });
    let below = 0;
    for (const row of inventoryRows) {
      if ((row._sum.availableQuantity ?? 0) <= threshold) below++;
    }
    return { totalMatching: inventoryRows.length, belowThreshold: below };
  }

  // For specific scopes, query Shopify GraphQL directly to get real-time accurate counts.
  let totalMatching = 0;
  let belowThreshold = 0;

  try {
    let queryStr = "";
    if (scopeType === "vendor") {
      const vendors = scopeValue.split(",").map((v) => v.trim()).filter(Boolean);
      queryStr = vendors.map((v) => `vendor:'${v}'`).join(" OR ");
    } else if (scopeType === "collection") {
      const collectionIds = scopeValue.split(",").map((id) => id.split("/").pop());
      queryStr = collectionIds.map((id) => `collection_id:${id}`).join(" OR ");
    }

    if (scopeType === "vendor" || scopeType === "collection") {
      // Query products based on vendor/collection
      const response = await admin.graphql(
        `#graphql
        query($query: String!) {
          products(first: 50, query: $query) {
            edges {
              node {
                variants(first: 20) {
                  edges {
                    node {
                      inventoryItem {
                        inventoryLevels(first: 10) {
                          edges {
                            node {
                              location { id }
                              quantities(names: ["available"]) { quantity }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
        { variables: { query: queryStr } }
      );
      const json = await response.json();
      const products = json.data?.products?.edges || [];
      for (const p of products) {
        const variants = p.node?.variants?.edges || [];
        for (const v of variants) {
          const levels = v.node?.inventoryItem?.inventoryLevels?.edges || [];
          let available = 0;
          let matchedLocation = false;
          for (const l of levels) {
            if (!locationId || l.node.location.id === locationId) {
              matchedLocation = true;
              available += l.node.quantities[0]?.quantity ?? 0;
            }
          }
          if (matchedLocation) {
            totalMatching++;
            if (available <= threshold) belowThreshold++;
          }
        }
      }
    } else if (scopeType === "product" || scopeType === "variant") {
      const ids = scopeValue.split(",").map((v) => v.trim()).filter(Boolean);
      // Ensure we don't exceed Shopify's limits, but typically users don't pick more than 50 at once manually
      const sliceIds = ids.slice(0, 50);
      
      const response = await admin.graphql(
        `#graphql
        query($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              variants(first: 50) {
                edges {
                  node {
                    inventoryItem {
                      inventoryLevels(first: 10) {
                        edges {
                          node {
                            location { id }
                            quantities(names: ["available"]) { quantity }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            ... on ProductVariant {
              inventoryItem {
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      location { id }
                      quantities(names: ["available"]) { quantity }
                    }
                  }
                }
              }
            }
          }
        }`,
        { variables: { ids: sliceIds } }
      );
      const json = await response.json();
      const nodes = json.data?.nodes || [];
      
      for (const node of nodes) {
        if (!node) continue;
        
        if (scopeType === "product") {
          const variants = node.variants?.edges || [];
          for (const v of variants) {
            const levels = v.node?.inventoryItem?.inventoryLevels?.edges || [];
            let available = 0;
            let matchedLocation = false;
            for (const l of levels) {
              if (!locationId || l.node.location.id === locationId) {
                matchedLocation = true;
                available += l.node.quantities[0]?.quantity ?? 0;
              }
            }
            if (matchedLocation) {
              totalMatching++;
              if (available <= threshold) belowThreshold++;
            }
          }
        } else if (scopeType === "variant") {
          const levels = node.inventoryItem?.inventoryLevels?.edges || [];
          let available = 0;
          let matchedLocation = false;
          for (const l of levels) {
            if (!locationId || l.node.location.id === locationId) {
              matchedLocation = true;
              available += l.node.quantities[0]?.quantity ?? 0;
            }
          }
          if (matchedLocation) {
            totalMatching++;
            if (available <= threshold) belowThreshold++;
          }
        }
      }
    }

  } catch (error) {
    console.error("Live preview error:", error);
    // fallback if query fails
    return { totalMatching: 0, belowThreshold: 0 };
  }

  return { totalMatching, belowThreshold };
}

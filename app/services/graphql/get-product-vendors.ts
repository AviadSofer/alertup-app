import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";

export async function getProductVendors(
  admin: AdminApiContext,
): Promise<string[]> {
  try {
    const response = await admin.graphql(`#graphql
      query {
        shop {
          productVendors(first: 250) {
            edges {
              node
            }
          }
        }
      }
    `);

    const json = await response.json();
    const vendors = json.data?.shop?.productVendors?.edges?.map((e: any) => e.node) || [];
    return vendors;
  } catch (err) {
    console.error("Failed to fetch product vendors", err);
    return [];
  }
}

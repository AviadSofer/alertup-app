import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";

export interface ShopInfo {
  email: string;
  contactEmail: string;
  name: string;
  myshopifyDomain: string;
  plan: {
    displayName: string;
  };
}

export async function getShopInfo(
  admin: AdminApiContext,
): Promise<ShopInfo> {
  const response = await admin.graphql(`#graphql
    query {
      shop {
        email
        contactEmail
        name
        myshopifyDomain
        plan {
          displayName
        }
      }
    }
  `);

  const json = await response.json();
  const shop = json.data?.shop;
  return shop;
}

import type { AdminApiContext } from "node_modules/@shopify/shopify-app-react-router/dist/ts/server/clients";

export class TransientApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "TransientApiError";
  }
}

async function getShopifyGraphQLByHttp<T = any>(
  shopifyDomain: string,
  accessToken: string,
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://${shopifyDomain}/admin/api/2025-04/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query,
            ...(variables && { variables }),
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new TransientApiError(`API call failed with status: ${response.status}`, response.status);
        }
        // Permanent error (e.g. 401 Unauthorized, 404 Not Found, 400 Bad Request)
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const json = await response.json();

      if (json.errors) {
        // GraphQL errors (e.g., Throttled)
        const errorMessage = JSON.stringify(json.errors);
        if (errorMessage.includes("Throttled")) {
          throw new TransientApiError(`GraphQL Throttled: ${errorMessage}`);
        }
        throw new Error(`GraphQL errors: ${errorMessage}`);
      }

      return json as T;
    } catch (error: unknown) {
      lastError = error;
      
      if (error instanceof TransientApiError && attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 200);
        const waitMs = Math.pow(2, attempt) * 500 + jitter;
        
        console.warn(
          `[Shopify HTTP API] Transient error or Throttled, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      // If it's a permanent error or we exhausted retries, throw it
      throw error;
    }
  }

  throw lastError;
}

async function getShopifyGraphQLByAdmin<T = any>(
  admin: AdminApiContext,
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await admin.graphql(
        query,
        variables ? { variables } : undefined,
      );
      const json = await response.json();
      return json as T;
    } catch (error: unknown) {
      lastError = error;
      const isThrottled =
        error instanceof Error && error.message?.includes("Throttled");

      if (isThrottled && attempt < maxRetries) {
        // Reduced backoff to 500ms, 1s, 2s with random jitter (0-200ms)
        // Jitter prevents parallel Promise.all requests from retrying at the exact same millisecond
        const jitter = Math.floor(Math.random() * 200);
        const waitMs = Math.pow(2, attempt) * 500 + jitter;
        
        console.warn(
          `[Shopify API] Throttled, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export interface ShopifyHttpOptions {
  shopifyDomain: string;
  accessToken: string;
}

export const shopifyFetchService = {
  getShopifyGraphQLByHttp,
  getShopifyGraphQLByAdmin,
};

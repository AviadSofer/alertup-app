import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData, useRouteError } from 'react-router';
import { NavMenu, TitleBar } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ActionButtons } from "../components/ActionButtons";
import { FeedbackCard } from "../components/FeedbackCard";
import { ToastProvider } from "app/components/Toast";
import { isPivotPlaceholderEnabled } from "app/lib/feature-toggles";
import { validate } from "app/services/auth-validation/validation.service";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const result = await validate(request);
  if (result.redirect) return result.redirect;

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    pivotEnabled: isPivotPlaceholderEnabled(),
    shop: result.shop,
  };
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const { apiKey, pivotEnabled } = useLoaderData<typeof loader>();

  return (
    <AppProvider apiKey={apiKey} i18n={polarisTranslations} embedded>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <TitleBar title="Stockup">
            <ActionButtons />
          </TitleBar>
          <NavMenu>
            {pivotEnabled ? (
              <>
                <Link to="/app" rel="home">
                  Dashboard
                </Link>
                <Link to="/app/alerts/new">Create Rule</Link>
                <Link to="/app/alerts">Alert Rules</Link>
                <Link to="/app/alerts/history">Alert History</Link>
              </>
            ) : (
              <>
                <Link to="/app" rel="home">
                  Home
                </Link>
                <Link to="/app/reorder">Reorder</Link>
                <Link to="/app/inventory">Inventory Analysis</Link>
              </>
            )}
          </NavMenu>

          <div style={{ paddingBottom: "2rem" }}>
            <Outlet />
            <FeedbackCard />
          </div>
        </ToastProvider>
      </QueryClientProvider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

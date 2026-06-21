import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import { NavMenu } from "@shopify/app-bridge-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { FeedbackCard } from "../components/FeedbackCard";
import { ToastProvider } from "app/components/Toast";
import { validate } from "app/services/auth-validation/validation.service";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const result = await validate(request);
  if (result.redirect) return result.redirect;
  return { apiKey: process.env.SHOPIFY_API_KEY || "", shop: result.shop };
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
  const data = useLoaderData<typeof loader>();
  if (!data) return null;
  const { apiKey } = data;

  return (
    <PolarisAppProvider i18n={polarisTranslations}>
      <AppProvider embedded apiKey={apiKey}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <NavMenu>
              <Link to="/app" rel="home">Dashboard</Link>
              <Link to="/app/alerts/new">Create Rule</Link>
              <Link to="/app/alerts">Alert Rules</Link>
              <Link to="/app/alerts/history">Alert History</Link>
            </NavMenu>
            <Outlet />
            <FeedbackCard />
          </ToastProvider>
        </QueryClientProvider>
      </AppProvider>
    </PolarisAppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

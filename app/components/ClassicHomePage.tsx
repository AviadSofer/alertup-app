import { Page, Layout } from "@shopify/polaris";
import type { InventoryStatus } from "../models/inventory-status.server";
import { InventoryStatusBox } from "./InventoryStatusBox";
import { WelcomeMessage } from "./WelcomeMessage";
import { InsightsBox } from "./InsightsBox";
import { Footer } from "./Footer";

export function ClassicHomePage({
  inventoryStatus,
}: {
  inventoryStatus: InventoryStatus;
}) {
  return (
    <Page>
      <div style={{ paddingBottom: 40 }}>
        <Layout>
          <Layout.Section>
            <WelcomeMessage />
          </Layout.Section>

          <Layout.Section>
            <InsightsBox />
          </Layout.Section>

          <Layout.Section>
            <InventoryStatusBox status={inventoryStatus} />
          </Layout.Section>

          <Layout.Section>
            <Footer />
          </Layout.Section>
        </Layout>
      </div>
    </Page>
  );
}

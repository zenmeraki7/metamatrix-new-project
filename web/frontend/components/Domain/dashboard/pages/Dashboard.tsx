import {
  Page,
  BlockStack,
  Layout,
  InlineGrid,
  Box,
  InlineStack,
  Button,
} from "@shopify/polaris";
import { DashboardHeader } from "../components/DashboardHeader";
import { MetricsGrid } from "../components/MetricsGrid";
import { QuickActions } from "../components/QuickActions";
import { ResourcesSection } from "../components/ResourcesSection";
import DemoVideo from "../components/DemoVideo";
import { PlusIcon } from "@shopify/polaris-icons";

export default function DashboardPage() {
  return (
    <Page>
      <BlockStack gap="600">
        <DashboardHeader />

        <Layout>
          {/* 🔹 FIRST ROW */}
          <Layout.Section>
            <MetricsGrid />
          </Layout.Section>

          <Layout.Section>
            <InlineStack align="end">
              <Button variant="primary" icon={PlusIcon}>
                Edit now
              </Button>
            </InlineStack>
          </Layout.Section>

          {/* 🔹 SECOND ROW */}
          <Layout.Section>
            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              <QuickActions />
              <ResourcesSection />
            </InlineGrid>
          </Layout.Section>

          {/* 🔹 DEMO VIDEO */}
          <Layout.Section>
            <DemoVideo />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

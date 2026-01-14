import {
  Page,
  BlockStack,
  Layout,
  InlineGrid,
} from "@shopify/polaris";
import { DashboardHeader } from "../components/DashboardHeader";
import { MetricsGrid } from "../components/MetricsGrid";
import { QuickActions } from "../components/QuickActions";
import { ResourcesSection } from "../components/ResourcesSection";
import DemoVideo from "../components/DemoVideo";

export default function DashboardPage() {
  return (
    <Page>
      <BlockStack gap="600">
        <DashboardHeader />
        
        <Layout>
          <Layout.Section>
            <MetricsGrid />
          </Layout.Section>

          <Layout.Section>
            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              <QuickActions />
              <ResourcesSection />
            </InlineGrid>
          </Layout.Section>

           <Layout.Section>
           <DemoVideo/>
          </Layout.Section>
        </Layout>


      </BlockStack>
    </Page>
  );
}

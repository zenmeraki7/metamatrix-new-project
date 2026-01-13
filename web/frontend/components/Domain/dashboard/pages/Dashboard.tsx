import {
  Page,
  BlockStack,
  Layout,
} from "@shopify/polaris";
import { DashboardHeader } from "../components/DashboardHeader";
import { OverviewSection } from "../components/OverviewSection";
import { ThingsToDo } from "../components/ThingsToDo";
import { LearnMoreSection } from "../components/LearnMoreSection";

export default function DashboardPage() {
  return (
    <Page>
      <BlockStack gap="800">
        <DashboardHeader />
        
        <Layout>
          <Layout.Section>
            <OverviewSection />
          </Layout.Section>

          <Layout.Section>
            <ThingsToDo />
          </Layout.Section>

          <Layout.Section>
            <LearnMoreSection />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
// OverviewSection.tsx
import { InlineGrid, BlockStack, Text, Box } from "@shopify/polaris";
import { MetricCard } from "./MetricCard";

export function OverviewSection() {
  return (
    <BlockStack gap="500">
      <Box>
        <Text as="h2" variant="headingXl" fontWeight="semibold">
          Overview
        </Text>
      </Box>
      
      <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
        <MetricCard 
          title="Bulk Edits" 
          count={17} 
          tone="success"
          subtitle="Active operations"
        />
        <MetricCard 
          title="Product Exports" 
          count={0}
          subtitle="Completed today"
        />
        <MetricCard 
          title="Product Imports" 
          count={0}
          subtitle="Pending imports"
        />
      </InlineGrid>
    </BlockStack>
  );
}
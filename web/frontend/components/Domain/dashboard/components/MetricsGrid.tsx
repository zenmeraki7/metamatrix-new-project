import { InlineGrid } from "@shopify/polaris";
import { StatCard } from "./StatCard";

export function MetricsGrid() {
  return (
    <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
      <StatCard
        label="Bulk Edits"
        value="17"
        subtitle="Active operations"
        trend={{ value: "+3", direction: "up" }}
        tone="success"
      />
      
      <StatCard
        label="Product Exports"
        value="0"
        subtitle="Completed today"
        tone="subdued"
      />
      
      <StatCard
        label="Product Imports"
        value="0"
        subtitle="Pending imports"
        tone="subdued"
      />
    </InlineGrid>
  );
}

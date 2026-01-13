// MetricCard.tsx
import {
  Card,
  BlockStack,
  Text,
  InlineStack,
  Badge,
  Box,
} from "@shopify/polaris";

type Props = {
  title: string;
  count: number;
  tone?: "success" | "critical" | "warning" | "info";
  subtitle?: string;
};

export function MetricCard({ title, count, tone, subtitle }: Props) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="start">
          <Text as="h3" variant="headingMd" tone="subdued">
            {title}
          </Text>
          {tone && <Badge tone={tone}>{count}</Badge>}
        </InlineStack>
        
        <Box>
          <Text as="p" variant="heading2xl">
            {count}
          </Text>
          {subtitle && (
            <Text as="p" variant="bodySm" tone="subdued">
              {subtitle}
            </Text>
          )}
        </Box>
      </BlockStack>
    </Card>
  );
}
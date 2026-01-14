import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
} from "@shopify/polaris";

type TrendDirection = "up" | "down";

type Props = {
  label: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    direction: TrendDirection;
  };
  tone?: "success" | "subdued";
};

export function StatCard({ label, value, subtitle, trend, tone }: Props) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="start">
          <Text as="p" variant="bodySm" tone="subdued">
            {label}
          </Text>
          {trend && (
            <Badge
              tone={trend.direction === "up" ? "success" : "critical"}
            >
              {trend.value}
            </Badge>
          )}
        </InlineStack>

        <BlockStack gap="100">
          <Text as="p" variant="heading2xl" fontWeight="bold">
            {value}
          </Text>
          {subtitle && (
            <Text as="p" variant="bodySm" tone={tone || "subdued"}>
              {subtitle}
            </Text>
          )}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

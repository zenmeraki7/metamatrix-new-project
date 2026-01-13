import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Icon,
  Box,
} from "@shopify/polaris";
import type { IconSource } from "@shopify/polaris";

type Props = {
  title: string;
  description: string;
  icon: IconSource;
};

export function LearnCard({ title, description, icon }: Props) {
  return (
    <Card>
      <BlockStack gap="300">
        {/* Header row */}
        <InlineStack gap="300" align="start">
          <Box
            background="bg-surface-secondary"
            padding="200"
            borderRadius="200"
          >
            <Icon source={icon} tone="critical" />
          </Box>

          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">
              {title}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {description}
            </Text>
          </BlockStack>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

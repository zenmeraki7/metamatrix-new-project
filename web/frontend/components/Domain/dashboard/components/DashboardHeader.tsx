
// DashboardHeader.tsx
import {
  InlineStack,
  Text,
  Select,
  BlockStack,
  Box,
} from "@shopify/polaris";

export function DashboardHeader() {
  return (
    <Box paddingBlockStart="400">
      <InlineStack align="space-between" blockAlign="start">
        <BlockStack gap="200">
          <Text variant="heading2xl" as="h1">
            Dashboard
          </Text>
          <Text as="p" variant="bodyLg" tone="subdued">
            Manage your store's bulk operations and data
          </Text>
        </BlockStack>

        <Select
          label="Language"
          labelInline
          options={[
            { label: "English", value: "en" },
            { label: "Spanish", value: "es" },
            { label: "French", value: "fr" }
          ]}
          value="en"
          onChange={() => {}}
        />
      </InlineStack>
    </Box>
  );
}
import {
  InlineStack,
  Text,
  Select,
  BlockStack,
  Badge,
} from "@shopify/polaris";

export function DashboardHeader() {
  return (
    <InlineStack align="space-between" blockAlign="start" wrap={false}>
      <BlockStack gap="200">
        <InlineStack gap="300" blockAlign="center">
          <Text variant="heading2xl" as="h1">
            Dashboard
          </Text>
          <Badge tone="info">17 Active</Badge>
        </InlineStack>
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
          { label: "French", value: "fr" },
        ]}
        value="en"
        onChange={() => {}}
      />
    </InlineStack>
  );
}

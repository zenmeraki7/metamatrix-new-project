import { Card, BlockStack, Box, Text } from "@shopify/polaris";
import {
  EditIcon,
  ImportIcon,
  ExportIcon,
  ClipboardChecklistIcon,
} from "@shopify/polaris-icons";
import { ResourceCard } from "./ResourceCard";

export function ResourcesSection() {
  return (
    <Card>
      <BlockStack gap="500">
        <BlockStack gap="200" inlineAlign="center">
          <Box paddingBlockStart="600">
            <span style={{ color: "var(--p-color-text-brand)" }}>
              <Text as="h2" variant="headingLg" fontWeight="bold">
                Learn more about Metamatrix
              </Text>
            </span>
          </Box>
        </BlockStack>

        <BlockStack gap="400">
          <ResourceCard
            icon={EditIcon}
            iconTone="magic"
            title="Tips for Bulk Editing"
            description="Safely bulk edit products and variants with live previews, progress tracking, and one-click undo."
          />

          <ResourceCard
            icon={ImportIcon}
            iconTone="info"
            title="Edit with Spreadsheet"
            description="Update products via spreadsheet without reformatting—match by SKU, handle, ID, and more"
          />

          <ResourceCard
            icon={ExportIcon}
            iconTone="success"
            title="Export Product Data"
            description="Export products to Excel, CSV, Google Shopping, or Matrixify, with recurring or public URL options."
          />

          <ResourceCard
            icon={ClipboardChecklistIcon}
            iconTone="warning"
            title="Changelog"
            description="Stay updated with the fastest, safest product updates—check our changelog for improvements."
          />
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

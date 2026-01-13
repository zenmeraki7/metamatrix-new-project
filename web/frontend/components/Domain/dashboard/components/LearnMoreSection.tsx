import { InlineGrid, BlockStack, Text } from "@shopify/polaris";
import {
  EditIcon,
  ImportIcon,
  ExportIcon,
  ClipboardChecklistIcon,
} from "@shopify/polaris-icons";
import { LearnCard } from "./LearnCard";

export function LearnMoreSection() {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingLg">
        Learn more about Metamatrix
      </Text>

      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
        <LearnCard
          title="Tips for Bulk Editing"
          description="Safely bulk edit products and variants with live previews, progress tracking, and one-click undo."
          icon={EditIcon}
        />

        <LearnCard
          title="Edit products with a spreadsheet"
          description="Update products using spreadsheets without reformatting. Match by SKU, handle, ID, and more."
          icon={ImportIcon}
        />

        <LearnCard
          title="Export your product data"
          description="Export data to Excel, CSV, Google Shopping, or Matrixify. Schedule recurring exports or public URLs."
          icon={ExportIcon}
        />

        <LearnCard
          title="Metamatrix Changelog"
          description="See the latest improvements and updates as we continue to make Metamatrix faster and safer."
          icon={ClipboardChecklistIcon}
        />
      </InlineGrid>
    </BlockStack>
  );
}

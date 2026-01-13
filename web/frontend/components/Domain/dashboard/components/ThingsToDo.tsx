// ThingsToDo.tsx
import {
  Card,
  BlockStack,
  Button,
  Text,
 InlineGrid,
  Box,
} from "@shopify/polaris";
import { PlusIcon, UploadIcon, ExportIcon } from "@shopify/polaris-icons";

export function ThingsToDo() {
  return (
    <Card>
      <BlockStack gap="500">
        <Box>
          <Text as="h2" variant="headingLg">
          Things To Do
          </Text>
          <Box paddingBlockStart="200">
          <Text as="p" variant="bodySm" tone="subdued" >
            Common tasks to manage your products
          </Text>
          </Box>
        </Box>

        <BlockStack gap="300">
          <Button 
            fullWidth 
            size="large" 
            variant="primary"
            icon={PlusIcon}
          >
            New Bulk Edit
          </Button>
          
          <InlineGrid columns={2} gap="300">
            <Button 
              fullWidth 
              size="large"
              icon={UploadIcon}
            >
              Upload Spreadsheet
            </Button>
            <Button 
              fullWidth 
              size="large"
              icon={ExportIcon}
            >
              Export Data
            </Button>
          </InlineGrid>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
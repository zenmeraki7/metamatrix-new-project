import {
  Card,
  BlockStack,
  InlineStack,
  Button,
  Text,
  Box,
  Divider,
  Icon,
} from "@shopify/polaris";
import {
  PlusIcon,
  UploadIcon,
  ExportIcon,
} from "@shopify/polaris-icons";

export function QuickActions() {
  return (
    <Card>
      {/* Full height container */}
      <Box
        minHeight="100%"
        padding="400"
      >
        <BlockStack gap="500" inlineAlign="stretch">

          {/* Header / Hero */}
          <Box
            background="bg-surface-secondary"
            padding="400"
            borderRadius="300"
          >
            <BlockStack gap="100">
              <Text as="h2" variant="headingLg" fontWeight="bold">
                Things To Do
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Common tasks to manage your products faster
              </Text>
            </BlockStack>
          </Box>

          {/* Action tiles */}
          <BlockStack gap="300">
            <ActionTile
              title="New Bulk Edit"
              description="Edit prices, inventory, metafields & more"
              icon={PlusIcon}
              iconColor="#008060"
              primary
            />

            <ActionTile
              title="Upload Spreadsheet"
              description="Import updates using CSV or Excel files"
              icon={UploadIcon}
              iconColor="#2C6ECB"
            />

            <ActionTile
              title="Export Data"
              description="Download product data or schedule exports"
              icon={ExportIcon}
              iconColor="#8C6EBC"
            />
          </BlockStack>

          {/* Push CTA to bottom */}
          <Box paddingBlockStart="400">
            <Divider />
            <Box paddingBlockStart="300">
            
            </Box>
          </Box>

        </BlockStack>
      </Box>
    </Card>
  );
}

/* ---------- Action Tile Component ---------- */

function ActionTile({
  title,
  description,
  icon,
  iconColor,
  primary = false,
}: {
  title: string;
  description: string;
  icon: any;
  iconColor?: string;
  primary?: boolean;
}) {
  return (
    <Card background={primary ? "bg-fill-brand" : "bg-surface"}>
      <Box padding="400">
        <InlineStack gap="400" align="space-between" blockAlign="center">
          <InlineStack gap="400" blockAlign="center">
            {/* Colored icon circle */}
            <Box
              background="bg-surface"
              padding="300"
              borderRadius="full"
              minWidth="40px"
              minHeight="40px"
            >
              <div style={{ color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon source={icon} tone="base" />
              </div>
            </Box>

            <BlockStack gap="100">
              <Text
                variant="headingSm"
                as="h3"
                tone={primary ? "text-inverse" : undefined}
              >
                {title}
              </Text>
              <Text as="p"
                variant="bodySm"
                tone={primary ? "text-inverse-secondary" : "subdued"}
              >
                {description}
              </Text>
            </BlockStack>
          </InlineStack>

          <Button
            icon={icon}
            variant={primary ? "primary" : "secondary"}
          >
            Open
          </Button>
        </InlineStack>
      </Box>
    </Card>
  );
}
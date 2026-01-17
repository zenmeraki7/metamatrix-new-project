import React from "react";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Banner,
  Icon,
  Box,
} from "@shopify/polaris";
import {
  RefreshIcon,
  CheckCircleIcon,
  ClockIcon,
  ProductIcon,
  CollectionIcon,
  CategoriesIcon,
} from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";

export default function ShopifyDataSync() {
  const navigate = useNavigate();

  const syncItems = [
    {
      id: "products",
      icon: ProductIcon,
      title: "Products",
      description: "Keeps product data in sync with Shopify",
      lastSync: "Today at 3:42 AM",
      count: "1,234 products",
    },
    {
      id: "types",
      icon: CategoriesIcon,
      title: "Product types",
      description: "Updates product categorization",
      lastSync: "Today at 3:42 AM",
      count: "45 types",
    },
    {
      id: "collections",
      icon: CollectionIcon,
      title: "Collections",
      description: "Syncs manual and smart collections",
      lastSync: "Today at 3:42 AM",
      count: "23 collections",
    },
  ];

  return (
    <Page
      title="Shopify data sync"
      backAction={{
        content: "Settings",
        onAction: () => navigate("/settings"),
      }}
      primaryAction={{
        content: "Sync all",
        icon: RefreshIcon,
      }}
    >
      <BlockStack gap="500">
        {/* Info banner */}
        <Banner tone="info">
          <BlockStack gap="200">
            <Text as="p" fontWeight="semibold">
              Automatic sync enabled
            </Text>
            <Text as="p" tone="subdued">
              Your store data syncs automatically every 24 hours.
            </Text>
          </BlockStack>
        </Banner>

        {/* Sync items */}
        {syncItems.map((item) => (
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="300" blockAlign="center">
                <Box
                  background="bg-surface-secondary"
                  padding="300"
                  borderRadius="200"
                >
                  <Icon source={ProductIcon} />
                </Box>

                <BlockStack gap="100">
                  <Text as="p" variant="headingSm">
                    Products
                  </Text>
                  <Text as="p" tone="subdued">
                    Keeps product data in sync with Shopify
                  </Text>

                  {/* ICON + DATE FIXED HERE */}
                  <InlineStack gap="050" blockAlign="center">
                    <Box>
                      <Icon source={ClockIcon} tone="subdued" />
                    </Box>

                    <Text as="span" variant="bodySm" tone="subdued">
                      Today at 3:42 AM
                    </Text>

                    <Text as="span" variant="bodySm" fontWeight="medium">
                      1,234 products
                    </Text>
                  </InlineStack>
                </BlockStack>
              </InlineStack>

              <InlineStack gap="200" blockAlign="center">
                <Badge tone="success">Synced</Badge>
                <Button size="slim" icon={RefreshIcon}>
                  Sync
                </Button>
              </InlineStack>
            </InlineStack>
          </Card>
        ))}

        {/* Schedule info */}
        <Card>
          <BlockStack gap="200">
            {/* HEADER */}
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={CheckCircleIcon} tone="success" />
                <Text as="p" variant="headingSm">
                  Sync schedule
                </Text>
              </InlineStack>
            </InlineStack>

            {/* DESCRIPTION */}
            <Text as="p" tone="subdued">
              MetaMetrix automatically syncs with Shopify every 24 hours. You
              can manually sync anytime if needed.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

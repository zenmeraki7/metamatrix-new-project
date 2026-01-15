import React from 'react';
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
  Divider,
  Box,
} from '@shopify/polaris';
import {
  RefreshIcon,
  CheckCircleIcon,
  ClockIcon,
  ProductIcon,
  CollectionIcon,
  CategoriesIcon,
} from '@shopify/polaris-icons';

import { useNavigate } from "react-router-dom";

export default function ShopifyDataSync() {
  const navigate = useNavigate();

  const syncItems = [
    {
      id: 'products',
      icon: ProductIcon,
      title: 'Products',
      description: 'Sync all your products with the latest data from Shopify',
      lastSync: 'Fri Jan 09 2026',
      count: '1,234 items',
      status: 'synced',
    },
    {
      id: 'types',
      icon: CategoriesIcon,
      title: 'Product Types',
      description: 'Keep your product categorization up to date',
      lastSync: 'Fri Jan 09 2026',
      count: '45 types',
      status: 'synced',
    },
    {
      id: 'collections',
      icon: CollectionIcon,
      title: 'Collections',
      description: 'Sync your product collections and smart collections',
      lastSync: 'Fri Jan 09 2026',
      count: '23 collections',
      status: 'synced',
    },
  ];

  return (
    <Page
      title="Shopify Data Sync"
      backAction={{
        content: "Settings",
        onAction: () => navigate("/Products"),
      }}
      primaryAction={{
        content: "Sync All Data",
        icon: RefreshIcon,
        onAction: () => navigate("/Products"),
      }}
    >
      <BlockStack gap="500">
        <Banner tone="info">
          <BlockStack gap="200">
            <Text as="p" fontWeight="semibold">
              Automatic synchronization enabled
            </Text>
            <Text as="p" tone="subdued">
              Your data syncs automatically every 24 hours. Last full sync completed on Fri Jan 09 2026 at 3:42 AM.
            </Text>
          </BlockStack>
        </Banner>

        <BlockStack gap="400">
          {syncItems.map((item) => (
            <Card key={item.id}>
              <BlockStack gap="400">
                {/* Header Section */}
                <InlineStack align="space-between" blockAlign="start">
                  <InlineStack gap="400" blockAlign="center">
                    <Box
                      padding="300"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <Icon source={item.icon} tone="base" />
                    </Box>
                    <BlockStack gap="100">
                      <Text variant="headingMd" as="h3">
                        {item.title}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {item.description}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Badge tone="success" icon={CheckCircleIcon}>
                    Synced
                  </Badge>
                </InlineStack>

                <Divider />

                {/* Footer Section */}
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="400" wrap={false}>
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={ClockIcon} tone="subdued" />
                      <Text as="p" variant="bodySm" tone="subdued">
                        {item.lastSync}
                      </Text>
                    </InlineStack>
                    <Divider borderWidth="050" />
                    <Text as="p" variant="bodySm" fontWeight="medium">
                      {item.count}
                    </Text>
                  </InlineStack>
                  <Button icon={RefreshIcon}>
                    Sync Now
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          ))}
        </BlockStack>

        {/* Info Card */}
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="300" blockAlign="center">
              <Box
                padding="200"
                background="bg-surface-success"
                borderRadius="100"
              >
                <Icon source={CheckCircleIcon} tone="success" />
              </Box>
              <BlockStack gap="100">
                <Text variant="headingMd" as="h3">
                  Automatic Sync Schedule
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Your MetaMetrix data automatically syncs with Shopify every 24 hours to ensure you always have the latest information. You can also trigger a manual sync anytime for immediate updates.
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Sync History Card */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Recent Sync Activity
            </Text>
            <BlockStack gap="300">
              {[
                { action: 'Full sync completed', time: 'Today at 3:42 AM', status: 'success' },
                { action: 'Products updated', time: 'Yesterday at 3:42 AM', status: 'success' },
                { action: 'Collections synced', time: 'Jan 08 at 3:42 AM', status: 'success' },
              ].map((log, index) => (
                <Box key={index}>
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <Icon
                        source={CheckCircleIcon}
                        tone="success"
                      />
                      <Text as="p" variant="bodyMd">
                        {log.action}
                      </Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {log.time}
                    </Text>
                  </InlineStack>
                  {index < 2 && <Box paddingBlockStart="300"><Divider /></Box>}
                </Box>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
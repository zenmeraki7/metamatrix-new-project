import React from "react";
import { Card, EmptyState, Text, BlockStack } from "@shopify/polaris";

export default function ExportHistorySection() {
  return (
    <Card>
      <BlockStack gap="400">
        <EmptyState heading="You have no export history" image="">
          <Text as="p" tone="subdued">
            Export operations will appear here once they are started.
          </Text>
        </EmptyState>
      </BlockStack>
    </Card>
  );
}

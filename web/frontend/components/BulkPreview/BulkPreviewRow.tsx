import { Box, Text, InlineStack, BlockStack, Divider } from "@shopify/polaris";
import React from "react";
import { useProductStore } from "../../state/productStore";

type BulkPreviewRowProps = {
  productId: string;
};

type BulkFieldChange = {
  before: unknown;
  after: unknown;
};

type BulkChangesMap = Record<string, BulkFieldChange>;

export default function BulkPreviewRow({ productId }: BulkPreviewRowProps) {
  const product = useProductStore((s) => s.productMap[productId]);
  const changes: BulkChangesMap | undefined = useProductStore(
    (s) => s.bulkChanges[productId]
  );

  if (!product || !changes) {
    // return <></>;
    return null;
  }

  const fields = Object.keys(changes);

  return (
    <Box background="bg-surface" padding="300">
      <InlineStack gap="400" align="start">
        {/* PRODUCT TITLE */}
        <Box width="25%">
          <Text as="h2" variant="bodySm" fontWeight="bold">
            {product.title}
          </Text>
        </Box>

        {/* BEFORE */}
        <Box width="35%">
          <BlockStack gap="100">
            {fields.map((field) => (
              <DiffCell
                key={field}
                field={field}
                value={changes[field].before}
                tone="subdued"
              />
            ))}
          </BlockStack>
        </Box>

        {/* AFTER */}
        <Box width="35%">
          <BlockStack gap="100">
            {fields.map((field) => (
              <DiffCell
                key={field}
                field={field}
                value={changes[field].after}
                tone="success"
              />
            ))}
          </BlockStack>
        </Box>
      </InlineStack>

      <Divider />
    </Box>
  );
}
type DiffCellProps = {
  value: unknown;
  field: string;
  tone?: "subdued" | "success" | "critical" | "caution";
};

function DiffCell({ value, field, tone = "subdued" }: DiffCellProps) {
  return (
    <Box paddingBlock="100">
      <Text as="span" tone={tone}>
        {field}: {String(value)}
      </Text>
    </Box>
  );
}

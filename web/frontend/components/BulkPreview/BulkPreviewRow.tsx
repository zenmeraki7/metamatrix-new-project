import { Box, Text, InlineStack } from "@shopify/polaris";
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

type DiffCellTone = "subdued" | "success" | "critical";

export default function BulkPreviewRow({
  productId,
}: BulkPreviewRowProps): JSX.Element {
  const product = useProductStore((s) => s.productMap[productId]);
  const changes: BulkChangesMap | undefined =
    useProductStore((s) => s.bulkChanges[productId]);

  if (!product || !changes) {
    return <></>;
  }

  const fields = Object.keys(changes);

  return (
    <Box
      background="bg-surface"
      borderBlockEnd="divider"
      paddingInline="300"
      paddingBlock="200"
    >
      <InlineStack gap="400" align="start">
        {/* PRODUCT TITLE */}
        <Box width="33%">
          <Text as="p" variant="bodySm" fontWeight="bold">
            {product.title}
          </Text>
        </Box>

        {/* BEFORE */}
        <Box width="33%">
          {fields.map((field) => (
            <DiffCell
              key={field}
              field={field}
              value={changes[field].before}
              tone="subdued"
            />
          ))}
        </Box>

        {/* AFTER */}
        <Box width="33%">
          {fields.map((field) => (
            <DiffCell
              key={field}
              field={field}
              value={changes[field].after}
              tone="success"
            />
          ))}
        </Box>
      </InlineStack>
    </Box>
  );
}

type DiffCellProps = {
  value: unknown;
  field: string;
 tone?: DiffCellTone;};

function DiffCell({
  value,
  field,
  tone = "subdued",
}: DiffCellProps): JSX.Element {
  return (
    <Box paddingBlock="100">
      <Text tone={tone} as="span">
        {field}: {String(value)}
      </Text>
    </Box>
  );
}

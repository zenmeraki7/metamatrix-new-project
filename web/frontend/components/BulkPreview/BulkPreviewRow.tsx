import { Box, Text } from "@shopify/polaris";
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
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid #eee",
        padding: "8px 12px",
        background: "white",
      }}
    >
      {/* PRODUCT TITLE */}
      <div style={{ flex: 2 }}>
        <Text variant="bodySm" fontWeight="bold">
          {product.title}
        </Text>
      </div>

      {/* BEFORE */}
      <div style={{ flex: 2 }}>
        {fields.map((field) => (
          <DiffCell
            key={field}
            field={field}
            value={changes[field].before}
            tone="subdued"
          />
        ))}
      </div>

      {/* AFTER */}
      <div style={{ flex: 2 }}>
        {fields.map((field) => (
          <DiffCell
            key={field}
            field={field}
            value={changes[field].after}
            tone="success"
          />
        ))}
      </div>
    </div>
  );
}

type DiffCellProps = {
  value: unknown;
  field: string;
  tone?: "subdued" | "success" | "critical" | "warning";
};

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

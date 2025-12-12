import { Box, Text } from "@shopify/polaris";
import React from "react";
import { useProductStore } from "../../state/productStore";

export default function BulkPreviewRow({ productId }) {
  const product = useProductStore((s) => s.productMap[productId]);
  const changes = useProductStore((s) => s.bulkChanges[productId]);

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
        {fields.map((f) => (
          <DiffCell
            key={f}
            value={changes[f].before}
            field={f}
            tone="subdued"
          />
        ))}
      </div>

      {/* AFTER */}
      <div style={{ flex: 2 }}>
        {fields.map((f) => (
          <DiffCell
            key={f}
            value={changes[f].after}
            field={f}
            tone="success"
          />
        ))}
      </div>
    </div>
  );
}

function DiffCell({ value, field, tone }) {
  return (
    <Box paddingBlock="1">
      <Text tone={tone} as="span">
        {field}: {String(value)}
      </Text>
    </Box>
  );
}

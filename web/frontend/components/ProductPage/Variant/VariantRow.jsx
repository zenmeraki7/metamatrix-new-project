import React from "react";
import { Text } from "@shopify/polaris";

function VariantRow({ variant }) {
  return (
    <div style={{ display: "flex", padding: 8, borderBottom: "1px solid #eee" }}>
      <div style={{ flex: 1 }}>{variant.title}</div>
      <div style={{ flex: 1 }}>{variant.sku}</div>
      <div style={{ flex: 1 }}>{variant.price}</div>
    </div>
  );
}

export default React.memo(VariantRow);

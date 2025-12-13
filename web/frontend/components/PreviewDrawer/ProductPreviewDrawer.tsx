import { Frame, ContextualSaveBar, Card, Text } from "@shopify/polaris";
import React from "react";
import { useProductStore } from "../../state/productStore";

type Product = {
  id: string;
  title: string;
  vendor: string;
  price: string | number;
};

type ProductPreviewDrawerProps = {
  product: Product;
};

export default function ProductPreviewDrawer({
  product,
}: ProductPreviewDrawerProps): JSX.Element {
  const close = useProductStore((s) => s.closePreview);

  return (
    <Frame>
      <ContextualSaveBar
        message="Viewing product"
        saveAction={{ content: "Close", onAction: close }}
      />

      <Card sectioned>
        <Text variant="headingLg" as="h2">
          {product.title}
        </Text>
        <Text>ID: {product.id}</Text>
        <Text>Vendor: {product.vendor}</Text>
        <Text>Price: {product.price}</Text>
      </Card>
    </Frame>
  );
}

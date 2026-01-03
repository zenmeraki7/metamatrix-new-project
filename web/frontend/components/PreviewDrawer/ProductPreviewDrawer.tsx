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
}: ProductPreviewDrawerProps) {
  const close = useProductStore((s) => s.closePreview);

  return (
    <Frame>
      <ContextualSaveBar
        message="Viewing product"
        saveAction={{ content: "Close", onAction: close }}
      />

      <Card>
        <Text variant="headingLg" as="h2">
          {product.title}
        </Text>
        <Text as="p">ID: {product.id}</Text>
        <Text as="p">Vendor: {product.vendor}</Text>
        <Text as="p">Price: {product.price}</Text>
      </Card>
    </Frame>
  );
}

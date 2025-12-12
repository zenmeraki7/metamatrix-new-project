import { Frame, ContextualSaveBar, Card, Text } from "@shopify/polaris";
import { useProductStore } from "../../state/productStore";

export default function ProductPreviewDrawer({ product }) {
  const close = useProductStore((s) => s.closePreview);

  return (
    <Frame>
      <ContextualSaveBar
        message="Viewing product"
        saveAction={{ content: "Close", onAction: close }}
      />

      <Card sectioned>
        <Text variant="headingLg">{product.title}</Text>
        <Text>ID: {product.id}</Text>
        <Text>Vendor: {product.vendor}</Text>
        <Text>Price: {product.price}</Text>
      </Card>
    </Frame>
  );
}

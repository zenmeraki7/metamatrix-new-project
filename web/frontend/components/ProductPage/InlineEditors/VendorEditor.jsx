import { TextField } from "@shopify/polaris";
import { useProductStore } from "../../../state/productStore";

export default function VendorEditor({ product }) {
  const update = useProductStore((s) => s.updateProductVendor);

  return (
    <TextField
      label=""
      value={product.vendor}
      onChange={(v) => update(product.id, v)}
    />
  );
}

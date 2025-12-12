import { TextField } from "@shopify/polaris";
import { useProductStore } from "../../../state/productStore";

export default function InlineTitleEditor({ product }) {
  const update = useProductStore((s) => s.updateProductTitle);

  return (
    <TextField
      label=""
      autoComplete="off"
      value={product.title}
      onChange={(v) => update(product.id, v)}
    />
  );
}

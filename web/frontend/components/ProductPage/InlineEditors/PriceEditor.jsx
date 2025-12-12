import { TextField } from "@shopify/polaris";
import { useProductStore } from "../../../state/productStore";

export default function InlinePriceEditor({ product }) {
  const update = useProductStore((s) => s.updateProductPrice);

  return (
    <TextField
      label=""
      type="number"
      value={String(product.price)}
      onChange={(v) => update(product.id, Number(v))}
    />
  );
}

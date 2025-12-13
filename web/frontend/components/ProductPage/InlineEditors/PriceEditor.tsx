import { TextField } from "@shopify/polaris";
import React from "react";
import { useProductStore } from "../../../state/productStore";

type Product = {
  id: string;
  price: number;
};

type InlinePriceEditorProps = {
  product: Product;
};

export default function InlinePriceEditor({
  product,
}: InlinePriceEditorProps): JSX.Element {
  const update = useProductStore((s) => s.updateProductPrice);

  const handleChange = (value: string): void => {
    update(product.id, Number(value));
  };

  return (
    <TextField
      label=""
      type="number"
      value={String(product.price)}
      onChange={handleChange}
    />
  );
}

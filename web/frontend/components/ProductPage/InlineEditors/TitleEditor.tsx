import { TextField } from "@shopify/polaris";
import React from "react";
import { useProductStore } from "../../../state/productStore";

type Product = {
  id: string;
  title: string;
};

type InlineTitleEditorProps = {
  product: Product;
};

export default function InlineTitleEditor({
  product,
}: InlineTitleEditorProps): JSX.Element {
  const update = useProductStore((s) => s.updateProductTitle);

  const handleChange = (value: string): void => {
    update(product.id, value);
  };

  return (
    <TextField
      label=""
      autoComplete="off"
      value={product.title}
      onChange={handleChange}
    />
  );
}

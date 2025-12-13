import React from "react";
import { Checkbox } from "@shopify/polaris";
import { useProductStore } from "../../state/productStore";
import InlineTitleEditor from "../ProductPage/InlineEditors/InventoryEditor";
import InlinePriceEditor from "../ProductPage/InlineEditors/PriceEditor";

type Product = {
  id: string;
  title: string;
  vendor: string;
  price: number;
  selected?: boolean;
};

type ProductRowProps = {
  product: Product;
};

export default function ProductRow({
  product,
}: ProductRowProps): JSX.Element[] {
  const toggleSelection = useProductStore((s) => s.toggleSelection);
  const openPreview = useProductStore((s) => s.openPreview);

  return [
    <Checkbox
      key="checkbox"
      checked={product.selected ?? false}
      onChange={() => toggleSelection(product.id)}
    />,
    <InlineTitleEditor key="title" product={product} />,
    <span key="vendor">{product.vendor}</span>,
    <InlinePriceEditor key="price" product={product} />,
  ];
}

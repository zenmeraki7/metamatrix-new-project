import { Checkbox } from "@shopify/polaris";
import { useProductStore } from "../../state/productStore";
import TitleEditor from "../ProductPage/InlineEditors/TitleEditor";
import PriceEditor from "../ProductPage/InlineEditors/PriceEditor";

export default function ProductRow(product) {
  const toggle = useProductStore((s) => s.toggleSelection);
  const openPreview = useProductStore((s) => s.openPreview);

  return [
    <Checkbox
      checked={product.selected}
      onChange={() => toggle(product.id)}
    />,
    <TitleEditor product={product} />,
    product.vendor,
    <PriceEditor product={product} />,
  ];
}

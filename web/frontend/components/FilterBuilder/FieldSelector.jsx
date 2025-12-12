import { Select } from "@shopify/polaris";
import { useFilterStore } from "../../state/filterStore";

export default function FieldSelector({ groupIndex, ruleIndex, rule }) {
  const updateRule = useFilterStore((s) => s.updateRule);

  const standardFields = [
    { label: "Title", value: "title" },
    { label: "Vendor", value: "vendor" },
    { label: "Tag", value: "tag" },
    { label: "Product Type", value: "product_type" },
    { label: "Price", value: "price" },
  ];

  return (
    <Select
      label="Field Type"
      options={[
        { label: "Standard Field", value: "standard" },
        { label: "Metafield", value: "metafield" },
      ]}
      value={rule.fieldType}
      onChange={(v) =>
        updateRule(groupIndex, ruleIndex, {
          fieldType: v,
        })
      }
    />
  );
}

import { Select } from "@shopify/polaris";
import React from "react";
import { useFilterStore } from "../../state/filterStore";

type Rule = {
  fieldType: "standard" | "metafield";
};

type FieldSelectorProps = {
  groupIndex: number;
  ruleIndex: number;
  rule: Rule;
};

export default function FieldSelector({
  groupIndex,
  ruleIndex,
  rule,
}: FieldSelectorProps): JSX.Element {
  const updateRule = useFilterStore((s) => s.updateRule);

  return (
    <Select
      label="Field Type"
      options={[
        { label: "Standard Field", value: "standard" },
        { label: "Metafield", value: "metafield" },
      ]}
      value={rule.fieldType}
      onChange={(value: "standard" | "metafield") =>
        updateRule(groupIndex, ruleIndex, {
          fieldType: value,
        })
      }
    />
  );
}

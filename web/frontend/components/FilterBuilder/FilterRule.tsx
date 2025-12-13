import { Select, TextField, Box } from "@shopify/polaris";
import React from "react";
import { useFilterStore } from "../../state/filterStore";

type Operator = "eq" | "contains" | "gt" | "lt";
type FieldType = "vendor" | "title" | "tag" | "metafield";

export type FilterRuleType = {
  field: FieldType;
  operator: Operator;
  value: string;
};

type FilterRuleProps = {
  index: number;
  rule: FilterRuleType;
};

export default function FilterRule({
  index,
  rule,
}: FilterRuleProps): JSX.Element {
  const updateRule = useFilterStore((s) => s.updateRule);

  const handleChange = <K extends keyof FilterRuleType>(
    field: K,
    value: FilterRuleType[K]
  ): void => {
    updateRule(index, {
      ...rule,
      [field]: value,
    });
  };

  return (
    <Box padding="200">
      <Select
        label="Field"
        options={[
          { label: "Vendor", value: "vendor" },
          { label: "Title", value: "title" },
          { label: "Tag", value: "tag" },
          { label: "Metafield", value: "metafield" },
        ]}
        value={rule.field}
        onChange={(v) => handleChange("field", v as FieldType)}
      />

      <Select
        label="Operator"
        options={[
          { label: "Equals", value: "eq" },
          { label: "Contains", value: "contains" },
          { label: "Greater Than", value: "gt" },
          { label: "Less Than", value: "lt" },
        ]}
        value={rule.operator}
        onChange={(v) => handleChange("operator", v as Operator)}
      />

      <TextField
        label="Value"
        value={rule.value}
        onChange={(v) => handleChange("value", v)}
      />
    </Box>
  );
}

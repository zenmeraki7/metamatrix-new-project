import { Select } from "@shopify/polaris";
import React from "react";
import { useFilterStore } from "../../state/filterStore";

type Operator =
  | "eq"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "before"
  | "after"
  | "on"
  | "not_contains";

type FieldValueType = "string" | "number" | "date" | "list";

type Rule = {
  fieldType: "standard" | "metafield";
  operator: Operator;
  metafield?: {
    type: FieldValueType;
  };
};

type OperatorSelectorProps = {
  groupIndex: number;
  ruleIndex: number;
  rule: Rule;
};

export default function OperatorSelector({
  groupIndex,
  ruleIndex,
  rule,
}: OperatorSelectorProps): JSX.Element {
  const updateRule = useFilterStore((s) => s.updateRule);

  const operatorOptions: Record<FieldValueType | "default", Operator[]> = {
    string: ["eq", "contains", "starts_with", "ends_with"],
    number: ["eq", "gt", "lt", "gte", "lte"],
    date: ["before", "after", "on"],
    list: ["contains", "not_contains"],
    default: ["eq", "contains"],
  };

  const type: FieldValueType =
    rule.fieldType === "metafield" && rule.metafield
      ? rule.metafield.type
      : "string";

  const options =
    operatorOptions[type] ?? operatorOptions.default;

  return (
    <Select
      label="Operator"
      options={options.map((op) => ({
        label: op.toUpperCase(),
        value: op,
      }))}
      value={rule.operator}
      onChange={(value: Operator) =>
        updateRule(groupIndex, ruleIndex, { operator: value })
      }
    />
  );
}

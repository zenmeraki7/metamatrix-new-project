import { Select } from "@shopify/polaris";
import { useFilterStore } from "../../state/filterStore";

export default function OperatorSelector({
  groupIndex,
  ruleIndex,
  rule,
}) {
  const updateRule = useFilterStore((s) => s.updateRule);

  const operatorOptions = {
    string: ["eq", "contains", "starts_with", "ends_with"],
    number: ["eq", "gt", "lt", "gte", "lte"],
    date: ["before", "after", "on"],
    list: ["contains", "not_contains"],
    default: ["eq", "contains"],
  };

  const type = rule.fieldType === "metafield"
    ? rule.metafield.type
    : "string";

  return (
    <Select
      label="Operator"
      options={operatorOptions[type]?.map((op) => ({
        label: op.toUpperCase(),
        value: op,
      }))}
      value={rule.operator}
      onChange={(v) =>
        updateRule(groupIndex, ruleIndex, { operator: v })
      }
    />
  );
}

import { TextField } from "@shopify/polaris";
import React from "react";
import { useFilterStore } from "../../state/filterStore";

type Rule = {
  value: string;
};

type ValueInputProps = {
  groupIndex: number;
  ruleIndex: number;
  rule: Rule;
};

export default function ValueInput({
  groupIndex,
  ruleIndex,
  rule,
}: ValueInputProps): JSX.Element {
  const updateRule = useFilterStore((s) => s.updateRule);

  return (
    <TextField
      label="Value"
      value={rule.value}
      onChange={(value: string) =>
        updateRule(groupIndex, ruleIndex, { value })
      }
    />
  );
}

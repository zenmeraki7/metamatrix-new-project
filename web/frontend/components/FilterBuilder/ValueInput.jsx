import { TextField } from "@shopify/polaris";
import { useFilterStore } from "../../state/filterStore";

export default function ValueInput({
  groupIndex,
  ruleIndex,
  rule,
}) {
  const updateRule = useFilterStore((s) => s.updateRule);

  return (
    <TextField
      label="Value"
      value={rule.value}
      onChange={(v) =>
        updateRule(groupIndex, ruleIndex, { value: v })
      }
    />
  );
}

// import { Select, TextField, Box } from "@shopify/polaris";
// import React from "react";
// import { useFilterStore } from "../../state/filterStore";

// type Operator = "eq" | "contains" | "gt" | "lt";
// type FieldType = "vendor" | "title" | "tag" | "metafield";

// export type FilterRuleType = {
//   field: FieldType;
//   operator: Operator;
//   value: string;
// };

// type FilterRuleProps = {
//   index: number;
//   rule: FilterRuleType;
// };

// export default function FilterRule({
//   index,
//   rule,
// }: FilterRuleProps): JSX.Element {
//   const updateRule = useFilterStore((s) => s.updateRule);

//   const handleChange = <K extends keyof FilterRuleType>(
//     field: K,
//     value: FilterRuleType[K]
//   ): void => {
//     updateRule(index, {
//       ...rule,
//       [field]: value,
//     });
//   };

//   return (
//     <Box padding="200">
//       <Select
//         label="Field"
//         options={[
//           { label: "Vendor", value: "vendor" },
//           { label: "Title", value: "title" },
//           { label: "Tag", value: "tag" },
//           { label: "Metafield", value: "metafield" },
//         ]}
//         value={rule.field}
//         onChange={(v) => handleChange("field", v as FieldType)}
//       />

//       <Select
//         label="Operator"
//         options={[
//           { label: "Equals", value: "eq" },
//           { label: "Contains", value: "contains" },
//           { label: "Greater Than", value: "gt" },
//           { label: "Less Than", value: "lt" },
//         ]}
//         value={rule.operator}
//         onChange={(v) => handleChange("operator", v as Operator)}
//       />

//       <TextField
//         label="Value"
//         value={rule.value}
//         onChange={(v) => handleChange("value", v)}
//       />
//     </Box>
//   );
// }


// web/frontend/components/FilterBuilder/FilterRule.tsx

import { memo, useState, useCallback } from "react";
import {
  Tag,
  Popover,
  Box,
  Select,
  TextField,
  Stack,
} from "@shopify/polaris";

import { useFilterStore } from "../../stores/filterStore";
import { FILTER_FIELDS } from "../../config/filterFields";
import type { FilterRule as Rule } from "../../stores/filterStore";

interface Props {
  groupIndex: number;
  ruleIndex: number;
  rule: Rule;
}

export const FilterRule = memo(function FilterRule({
  groupIndex,
  ruleIndex,
  rule,
}: Props) {
  const [open, setOpen] = useState(false);

  const openPicker = useFilterStore((s) => s.openFieldPicker);
  const removeRule = useFilterStore((s) => s.removeRule);
  const updateRule = useFilterStore((s) => s.updateRule);

  const field =
    rule.fieldPath &&
    Object.values(FILTER_FIELDS)
      .flat()
      .find((f) => f.fieldKey === rule.fieldPath);

  /* ------------------------------------------------------------------ */
  /* No field selected → open picker */
  /* ------------------------------------------------------------------ */

  if (!rule.fieldPath) {
    return (
      <Tag
        onClick={() => openPicker(groupIndex, ruleIndex)}
        onRemove={() => removeRule(groupIndex, ruleIndex)}
      >
        <span style={{ color: "var(--p-color-text-subdued)" }}>
          Select filter…
        </span>
      </Tag>
    );
  }

  const activator = (
    <Tag
      onClick={() => setOpen(true)}
      onRemove={() => removeRule(groupIndex, ruleIndex)}
    >
      <strong>{rule.fieldLabel}</strong>{" "}
      {rule.operator}{" "}
      <span>{rule.value || "…"}</span>
    </Tag>
  );

  return (
    <Popover
      active={open}
      activator={activator}
      onClose={() => setOpen(false)}
      sectioned
    >
      <Box minWidth="280px">
        <Stack gap="300" wrap>
          <Select
            label="Operator"
            labelHidden
            options={
              field?.operators.map((op) => ({
                label: op,
                value: op,
              })) ?? []
            }
            value={rule.operator}
            onChange={(op) =>
              updateRule(groupIndex, ruleIndex, {
                operator: op as Rule["operator"],
              })
            }
          />

          <TextField
            label="Value"
            labelHidden
            value={String(rule.value ?? "")}
            onChange={(val) =>
              updateRule(groupIndex, ruleIndex, { value: val })
            }
            autoComplete="off"
          />
        </Stack>
      </Box>
    </Popover>
  );
});

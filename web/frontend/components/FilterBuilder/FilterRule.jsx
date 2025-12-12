import { Select, TextField, Box } from "@shopify/polaris";
import { useFilterStore } from "../../state/filterStore";

export default function FilterRule({ index, rule }) {
  const updateRule = useFilterStore((s) => s.updateRule);

  const handleChange = (field, value) => {
    updateRule(index, { ...rule, [field]: value });
  };

  return (
    <Box padding="2">
      <Select
        label="Field"
        options={[
          { label: "Vendor", value: "vendor" },
          { label: "Title", value: "title" },
          { label: "Tag", value: "tag" },
          { label: "Metafield", value: "metafield" },
        ]}
        value={rule.field}
        onChange={(v) => handleChange("field", v)}
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
        onChange={(v) => handleChange("operator", v)}
      />

      <TextField
        label="Value"
        value={rule.value}
        onChange={(v) => handleChange("value", v)}
      />
    </Box>
  );
}

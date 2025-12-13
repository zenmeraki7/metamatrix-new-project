// web/frontend/components/FilterBuilder/FieldSection.tsx

import { memo } from "react";
import { Box, Text } from "@shopify/polaris";
import { FieldItem } from "./FieldItem";
import type { FilterFieldDef } from "../../config/filterFields";

interface FieldSectionProps {
  title: string;
  fields: FilterFieldDef[];
  onSelect: (field: FilterFieldDef) => void;
}

export const FieldSection = memo(function FieldSection({
  title,
  fields,
  onSelect,
}: FieldSectionProps) {
  if (!fields || fields.length === 0) return null;

  return (
    <Box paddingBlock="400" paddingInline="400">
      <Text variant="headingSm" as="h3">
        {title}
      </Text>

      <Box paddingBlockStart="200">
        {fields.map((field) => (
          <FieldItem
            key={field.fieldKey}
            label={field.label}
            onClick={() => onSelect(field)}
          />
        ))}
      </Box>
    </Box>
  );
});

import { Card, Button, Text, BlockStack, Box } from "@shopify/polaris";
import React from "react";
import FilterRule from "./FilterRule";
import { useFilterStore } from "../../state/filterStore";

type Rule = {
  fieldType?: string;
};

export default function FilterGroup() {
  const rules = useFilterStore((s) => s.rules);
  const addRule = useFilterStore((s) => s.addRule);

  return (
    <Card padding="400">
      {/* Header */}
      <Box paddingBlockEnd="200">
        <Text as="h2" variant="headingMd">
          Filter Rules
        </Text>
      </Box>

      {/* Rules */}
      <BlockStack gap="200">
        {rules.map((rule: Rule, idx: number) => (
          <FilterRule key={idx} index={idx} rule={rule} />
        ))}

        <Button onClick={addRule}>Add Rule</Button>
      </BlockStack>
    </Card>
  );
}

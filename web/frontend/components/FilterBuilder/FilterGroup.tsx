import { Card, Button } from "@shopify/polaris";
import React from "react";
import FilterRule from "./FilterRule";
import { useFilterStore } from "../../state/filterStore";

type Rule = {
  // extend this as your rule model grows
  fieldType?: string;
};

export default function FilterGroup(): JSX.Element {
  const rules = useFilterStore((s) => s.rules);
  const addRule = useFilterStore((s) => s.addRule);

  return (
    <Card title="Filter Rules" sectioned>
      {rules.map((rule: Rule, idx: number) => (
        <FilterRule key={idx} index={idx} rule={rule} />
      ))}

      <Button onClick={addRule}>Add Rule</Button>
    </Card>
  );
}

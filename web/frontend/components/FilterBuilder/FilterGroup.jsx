import { Card, Button } from "@shopify/polaris";
import FilterRule from "./FilterRule";
import { useFilterStore } from "../../state/filterStore";

export default function FilterGroup() {
  const rules = useFilterStore((s) => s.rules);
  const addRule = useFilterStore((s) => s.addRule);

  return (
    <Card title="Filter Rules" sectioned>
      {rules.map((rule, idx) => (
        <FilterRule key={idx} index={idx} rule={rule} />
      ))}

      <Button onClick={addRule}>Add Rule</Button>
    </Card>
  );
}

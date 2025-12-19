import { BlockStack, Button, Collapsible, ChoiceList } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

type StatusFilterProps = {
  isOpen: boolean;
  onToggle: () => void;
  selected: string[];
  onChange: (value: string[]) => void;
};

export function StatusFilter({ isOpen, onToggle, selected, onChange }: StatusFilterProps) {
  return (
    <BlockStack gap="200">
      <Button
        variant="plain"
        icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={onToggle}
        textAlign="left"
      >
        Status
      </Button>
      <Collapsible open={isOpen}>
        <ChoiceList
          titleHidden
          allowMultiple
          choices={[
            { label: "Active", value: "ACTIVE" },
            { label: "Draft", value: "DRAFT" },
            { label: "Archived", value: "ARCHIVED" },
          ]}
          selected={selected}
          onChange={onChange}
        />
      </Collapsible>
    </BlockStack>
  );
}
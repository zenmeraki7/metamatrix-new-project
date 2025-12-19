import { BlockStack, Button, Collapsible, TextField } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

type CollectionFilterProps = {
  isOpen: boolean;
  onToggle: () => void;
  value: string;
  onChange: (value: string) => void;
};

export function CollectionFilter({ isOpen, onToggle, value, onChange }: CollectionFilterProps) {
  return (
    <BlockStack gap="200">
      <Button
        variant="plain"
        icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={onToggle}
        textAlign="left"
      >
        Collection
      </Button>
      <Collapsible open={isOpen}>
        <TextField
          label="Collection ID (GID)"
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
      </Collapsible>
    </BlockStack>
  );
}
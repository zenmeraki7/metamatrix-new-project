import { BlockStack, Button, Collapsible, TextField } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

type ProductTypeFilterProps = {
  isOpen: boolean;
  onToggle: () => void;
  value: string;
  onChange: (value: string) => void;
};

export function ProductTypeFilter({ isOpen, onToggle, value, onChange }: ProductTypeFilterProps) {
  return (
    <BlockStack gap="200">
      <Button
        variant="plain"
        icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={onToggle}
        textAlign="left"
      >
        Product Type
      </Button>
      <Collapsible open={isOpen}>
        <TextField
          label="Product type contains"
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
      </Collapsible>
    </BlockStack>
  );
}
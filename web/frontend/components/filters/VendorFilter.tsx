import { BlockStack, Button, Collapsible, TextField } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

type VendorFilterProps = {
  isOpen: boolean;
  onToggle: () => void;
  value: string;
  onChange: (value: string) => void;
};

export function VendorFilter({ isOpen, onToggle, value, onChange }: VendorFilterProps) {
  return (
    <BlockStack gap="200">
      <Button
        variant="plain"
        icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={onToggle}
        textAlign="left"
      >
        Vendor
      </Button>
      <Collapsible open={isOpen}>
        <TextField
          label="Vendor contains"
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
      </Collapsible>
    </BlockStack>
  );
}
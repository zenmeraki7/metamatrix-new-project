import {
  BlockStack,
  Button,
  Collapsible,
  TextField,
  Select,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

type PriceProps = {
  isOpen: boolean;
  onToggle: () => void;
  operator: string;
  value: string;
  onOperatorChange: (value: string) => void;
  onValueChange: (value: string) => void;
};

const NUMBER_OPERATOR_OPTIONS = [
  { label: "<", value: "lt" },
  { label: "=", value: "eq" },
  { label: "!=", value: "neq" },
  { label: ">", value: "gt" },
];

export default function PriceFilter({
  isOpen,
  onToggle,
  operator,
  value,
  onOperatorChange,
  onValueChange,
}: PriceProps) {
  return (
    <BlockStack gap="200">
      <Button
        variant="plain"
        icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={onToggle}
        textAlign="left"
      >
        Price
      </Button>

      <Collapsible open={isOpen}>
        <BlockStack gap="200">
          <Select
            label="Condition"
            options={NUMBER_OPERATOR_OPTIONS}
            value={operator}
            onChange={onOperatorChange}
          />

          <TextField
            label="Price"
            type="number"
            value={value}
            onChange={onValueChange}
            autoComplete="off"
          />
        </BlockStack>
      </Collapsible>
    </BlockStack>
  );
}

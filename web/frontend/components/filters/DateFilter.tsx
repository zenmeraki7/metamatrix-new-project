import React, { useState } from "react";
import {
  BlockStack,
  Button,
  Collapsible,
  Select,
  DatePicker,
  TextField,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

export type DateOperator = "is_after" | "is_before" | "is_after_days" | "is_before_days";

const OPERATORS = [
  { label: "is after", value: "is_after" },
  { label: "is before", value: "is_before" },
  { label: "is after X days ago", value: "is_after_days" },
  { label: "is before X days ago", value: "is_before_days" },
];

type DateFilterProps = {
  label: string;
  isOpen: boolean;
  onToggle: () => void;

  operator: DateOperator;
  onOperatorChange: (op: DateOperator) => void;

  dateValue: string; // yyyy-mm-dd
  onDateChange: (date: string) => void;

  daysValue: string; // number of days
  onDaysChange: (days: string) => void;
};

export function DateFilter({
  label,
  isOpen,
  onToggle,
  operator,
  onOperatorChange,
  dateValue,
  onDateChange,
  daysValue,
  onDaysChange,
}: DateFilterProps) {
  const isDaysOperator =
    operator === "is_after_days" || operator === "is_before_days";
const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date }[]>([
  { start: new Date(), end: new Date() },
]);

  return (
    <BlockStack gap="200">
      <Button
        variant="plain"
        icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={onToggle}
        textAlign="left"
      >
        {label}
      </Button>

      <Collapsible open={isOpen}>
        <BlockStack gap="200">
          <Select
            label="Operator"
            options={OPERATORS}
            value={operator}
            onChange={(v) => onOperatorChange(v as DateOperator)}
          />

          {isDaysOperator ? (
            <TextField
              label="Days ago"
              type="number"
              value={daysValue}
              onChange={onDaysChange}
              min={0}
              placeholder="Enter number of days"
            />
          ) : (
<DatePicker
  month={selectedDates[0].start.getMonth()}
  year={selectedDates[0].start.getFullYear()}
  onChange={(dates: { start: Date; end: Date }[]) => {
    if (!dates || !dates[0]?.start || !dates[0]?.end) return;
    setSelectedDates(dates);
    onDateChange(dates[0].start.toISOString().split("T")[0]); // pass yyyy-mm-dd
  }}
  selected={selectedDates}
/>

          )}
        </BlockStack>
      </Collapsible>
    </BlockStack>
  );
}

export default DateFilter;

// web/frontend/components/FilterBuilder/FilterBuilder.tsx

import { memo } from "react";
import {
  Card,
  Box,
  InlineStack,
  Button,
  Text,
  Icon,
} from "@shopify/polaris";
import { FilterIcon, PlusIcon } from "@shopify/polaris-icons";

import { useFilterStore } from "../../stores/filterStore";
import { FilterRule } from "./FilterRule";
import { FieldPickerModal } from "./FieldPickerModal";

export const FilterBuilder = memo(function FilterBuilder() {
  const groups = useFilterStore((s) => s.groups);
  const addGroup = useFilterStore((s) => s.addGroup);
  const addRule = useFilterStore((s) => s.addRule);
  const clearAll = useFilterStore((s) => s.clearAll);

  const hasActiveFilters = groups.some(
    (group) => group.rules.length > 0
  );

  return (
    <Card padding="400">
      {/* Header */}
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="200" blockAlign="center">
          <Icon source={FilterIcon} />
          <Text as="h2" variant="headingSm">
            Filters
          </Text>
        </InlineStack>

        {hasActiveFilters && (
          <Button
            variant="plain"
            tone="critical"
            onClick={clearAll}
          >
            Clear all
          </Button>
        )}
      </InlineStack>

      {/* Groups */}
      <Box paddingBlockStart="400">
        {groups.map((group, groupIndex) => (
          <Box key={group.id}>
            {groupIndex > 0 && (
              <Box paddingBlock="300">
                <Text tone="subdued">OR</Text>
              </Box>
            )}

            <InlineStack gap="200" wrap>
              {group.rules.map((rule, ruleIndex) => (
                <FilterRule
                  key={rule.id}
                  groupIndex={groupIndex}
                  ruleIndex={ruleIndex}
                  rule={rule}
                />
              ))}

              <Button
                variant="plain"
                icon={PlusIcon}
                onClick={() => addRule(groupIndex)}
              >
                And
              </Button>
            </InlineStack>
          </Box>
        ))}
      </Box>

      {/* Field picker */}
      <FieldPickerModal />
    </Card>
  );
});

// components/filters/FilterBuilder.tsx
import {
  Popover,
  Button,
  Box,
  BlockStack,
  Divider,
  InlineStack,
} from "@shopify/polaris";
import { useFilterState } from "../../filters/useFilterState";
import { FilterGroup } from "./FilterGroup";

export function FilterBuilder() {
  const {
    draft,
    setDraft,
    applyDraft,
    clearAll,
    appliedCount,
  } = useFilterState();

  return (
   <BlockStack>
     <Popover
      active
      activator={
        <Button>
          Filters{appliedCount ? ` (${appliedCount})` : ""}
        </Button>
      }
    >
      <Box padding="300" width="420px">
        <BlockStack gap="300">
          {/* 🔑 ROOT GROUP */}
          <FilterGroup
            group={draft}
            onChange={setDraft}
          />

          <Divider />

          <InlineStack align="end" gap="200">
            <Button onClick={clearAll}>Clear All</Button>
            <Button variant="primary" onClick={applyDraft}>
              Apply Filters
            </Button>
          </InlineStack>
        </BlockStack>
      </Box>
    </Popover>
   </BlockStack>
  );
}

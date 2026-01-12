// components/filters/FilterBuilder.tsx
import {
  Popover,
  Button,
  Box,
  BlockStack,
  Divider,
  InlineStack,
} from "@shopify/polaris";
import { FilterGroup } from "./FilterGroup";
import { useState } from "react";
import { useFilterState } from "../../filters/useFilterState";

type Props = {
  filterState: ReturnType<typeof useFilterState>;
  onClose?: () => void;
  onProductsFetched?: (data: any) => void; // if you plan to fetch products here
  fetchProducts?: (args: { direction: string; filter: any }) => Promise<any>;
};

export function FilterBuilder({ filterState, onClose, onProductsFetched, fetchProducts }: Props) {
  const { draft, setDraft, applyDraft, clearAll, appliedCount } = filterState;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApplyFilters = async () => {
    applyDraft();

    if (fetchProducts) {
      try {
        setLoading(true);
        const data = await fetchProducts({ direction: "next", filter: draft });
        onProductsFetched?.(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    setOpen(false); // close popover
    onClose?.();
  };

  return (
    <BlockStack>
      <Popover
        active={open}
        activator={
          <Button onClick={() => setOpen(true)}>
            Filters{appliedCount ? ` (${appliedCount})` : ""}
          </Button>
        }
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
      >
        <Box padding={300} width="420px">
          <BlockStack gap={300}>
            {/* ROOT GROUP */}
            <FilterGroup group={draft} onChange={setDraft} />

            <Divider />

            <InlineStack align="end" gap={200}>
              <Button variant="primary" onClick={handleApplyFilters} loading={loading}>
                Apply Filters
              </Button>
              <Button onClick={() => clearAll()}>Clear All</Button>
            </InlineStack>
          </BlockStack>
        </Box>
      </Popover>
    </BlockStack>
  );
}

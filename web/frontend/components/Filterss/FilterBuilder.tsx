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
import { fetchProducts } from "../../filters/api"; // <-- make sure path is correct
import { useState } from "react";

export function FilterBuilder({
  onProductsFetched,
  onClose,
}: {
  onProductsFetched?: (products: any) => void;
  onClose?: () => void;
}) {

  const { draft, setDraft, applyDraft, clearAll, appliedCount } = useFilterState();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

 const handleApplyFilters = async () => {
  applyDraft();

  try {
    setLoading(true);
    const data = await fetchProducts({
      direction: "next",
      filter: draft,
    });

    onProductsFetched?.(data);
    setOpen(false); // ✅ close popover
    onClose?.();
  } catch (err) {
    console.error("Failed to fetch products:", err);
  } finally {
    setLoading(false);
  }
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
    onClose?.(); // optional callback to parent
  }}
      >
        <Box padding="300" width="420px">
          <BlockStack gap="300">
            {/* 🔑 ROOT GROUP */}
            <FilterGroup group={draft} onChange={setDraft} />

            <Divider />

             <InlineStack align="end" gap="200">
        <Button 
        onClick={clearAll}
        >Clear All
        </Button>
        <Button variant="primary" onClick={handleApplyFilters} disabled={!applyDraft}>
          {loading ? "Applying..." : "Apply Filters"}
        </Button>
      </InlineStack>
          </BlockStack>
        </Box>
      </Popover>
    </BlockStack>
  );
}

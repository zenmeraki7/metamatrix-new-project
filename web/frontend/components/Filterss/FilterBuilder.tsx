import {
  Modal,
  Button,
  Box,
  BlockStack,
  Divider,
  InlineStack,
} from "@shopify/polaris";
import { useState } from "react";
import { useFilterState } from "../../filters/useFilterState";
import { FilterGroup } from "./FilterGroup";
import { fetchProducts } from "../../filters/api";

export function FilterBuilder({
  onProductsFetched,
  onClose,
}: {
  onProductsFetched?: (products: any) => void;
  onClose?: () => void;
}) {
  const { draft, setDraft, applyDraft, clearAll, appliedCount } =
    useFilterState();

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
      setOpen(false);
      onClose?.();
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button onClick={() => setOpen(true)}>
        Filters{appliedCount ? ` (${appliedCount})` : ""}
      </Button>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
        title="Filters"
        primaryAction={{
          content: loading ? "Applying..." : "Apply Filters",
          onAction: handleApplyFilters,
          loading,
        }}
        secondaryActions={[
          {
            content: "Clear All",
            onAction: clearAll,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {/* ROOT FILTER GROUP */}
            <FilterGroup group={draft} onChange={setDraft} />

            <Divider />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}

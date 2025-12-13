import { memo, useState, useCallback } from "react";
import {
  Box,
  Card,
  InlineStack,
  Button,
  Text,
  Popover,
  ActionList,
} from "@shopify/polaris";

import { useSelectionStore } from "../../stores/selectionStore";
import { useJobStore } from "../../stores/jobStore";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";
import { useFilterStore } from "../../stores/filterStore";

export const BulkActionBar = memo(function BulkActionBar() {
  const selectedCount = useSelectionStore((s) => s.count);
  const clearSelection = useSelectionStore((s) => s.clear);

  const upsertJob = useJobStore((s) => s.upsertJob);
  const filters = useFilterStore((s) => s.groups);

  const fetch = useAuthenticatedFetch();

  const [active, setActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const togglePopover = useCallback(() => {
    setActive((v) => !v);
  }, []);

  const runBulkAction = useCallback(
    async (payload: {
      actionType: "UPDATE_STATUS" | "UPDATE_VENDOR";
      value: string;
    }) => {
      setSubmitting(true);
      setActive(false);

      const jobId = crypto.randomUUID();

      // Optimistic job insert
      upsertJob({
        id: jobId,
        type: payload.actionType,
        status: "pending",
        progress: 0,
        processed: 0,
        total: selectedCount,
      });

      try {
        const res = await fetch("/api/products/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId,
            filters: { ast: filters },
            action: payload,
          }),
        });

        if (!res.ok) {
          throw new Error("Bulk action failed");
        }

        // Backend will handle job updates
        clearSelection();
      } catch (err: any) {
        useJobStore.getState().updateJob(jobId, {
          status: "failed",
          error: err.message || "Bulk action failed",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [fetch, filters, selectedCount, upsertJob, clearSelection]
  );

  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "90%",
        maxWidth: 640,
      }}
    >
      <Card padding="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="300" blockAlign="center">
            <Box
              background="bg-surface-active"
              padding="200"
              borderRadius="100"
            >
              <Text as="span" fontWeight="bold">
                {selectedCount}
              </Text>
            </Box>
            <Text as="span" tone="subdued">
              selected
            </Text>
          </InlineStack>

          <InlineStack gap="200">
            <Button
              variant="tertiary"
              onClick={clearSelection}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Popover
              active={active}
              onClose={togglePopover}
              activator={
                <Button
                  variant="primary"
                  onClick={togglePopover}
                  loading={submitting}
                >
                  Edit products
                </Button>
              }
            >
              <ActionList
                actionRole="menuitem"
                items={[
                  {
                    content: "Set status → Active",
                    onAction: () =>
                      runBulkAction({
                        actionType: "UPDATE_STATUS",
                        value: "ACTIVE",
                      }),
                  },
                  {
                    content: "Set status → Draft",
                    onAction: () =>
                      runBulkAction({
                        actionType: "UPDATE_STATUS",
                        value: "DRAFT",
                      }),
                  },
                  {
                    content: "Change vendor",
                    onAction: () =>
                      runBulkAction({
                        actionType: "UPDATE_VENDOR",
                        value: "New Vendor",
                      }),
                  },
                ]}
              />
            </Popover>
          </InlineStack>
        </InlineStack>
      </Card>
    </div>
  );
});

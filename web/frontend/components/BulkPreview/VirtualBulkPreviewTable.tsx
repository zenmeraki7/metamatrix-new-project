import React, { useRef } from "react";
import { Box, Scrollable } from "@shopify/polaris";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useProductStore } from "../../state/productStore";
import BulkPreviewRow from "./BulkPreviewRow";

export default function VirtualBulkPreviewTable() {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const bulkChanges = useProductStore((s) => s.bulkChanges);
  const ids = Object.keys(bulkChanges);

  const rowVirtualizer = useVirtualizer({
    count: ids.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 10,
  });

  return (
    <Scrollable shadow height="60vh">
      <Box ref={parentRef}>
        <Box minHeight={`${rowVirtualizer.getTotalSize()}px`}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const productId = ids[virtualRow.index];

            return (
              /* REQUIRED NON-POLARIS NODE (virtualization primitive) */
              // Virtual scrolling ❌ Not supported in polaris
              // transform / translateY ❌ Not exposed in polaris
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <BulkPreviewRow productId={productId} />
              </div>
            );
          })}
        </Box>
      </Box>
    </Scrollable>
  );
}

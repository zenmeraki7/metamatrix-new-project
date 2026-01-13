import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Scrollable, Box } from "@shopify/polaris";
import { useProductStore } from "../../state/productStore";
import BulkPreviewRow from "./BulkPreviewRow";

export default function VirtualBulkPreviewTable(): JSX.Element {
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
    <Scrollable height="60vh" shadow ref={parentRef}>
      <Box position="relative" minHeight={`${rowVirtualizer.getTotalSize()}px`}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const productId = ids[virtualRow.index];

          return (
            <Box
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              position="absolute"
              insetInlineStart="0"
              width="100%"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <BulkPreviewRow productId={productId} />
            </Box>
          );
        })}
      </Box>
    </Scrollable>
  );
}

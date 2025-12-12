import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useProductStore } from "../../state/productStore";
import BulkPreviewRow from "./BulkPreviewRow";
import { Box } from "@shopify/polaris";

export default function VirtualBulkPreviewTable() {
  const parentRef = useRef(null);

  const bulkChanges = useProductStore((s) => s.bulkChanges);
  const ids = Object.keys(bulkChanges);

  const rowVirtualizer = useVirtualizer({
    count: ids.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: "60vh",
        overflow: "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const productId = ids[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`,
                width: "100%",
              }}
            >
              <BulkPreviewRow productId={productId} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

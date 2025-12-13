// import React, { useRef } from "react";
// import { useVirtualizer } from "@tanstack/react-virtual";
// import { Card, Box } from "@shopify/polaris";
// import { useProductStore } from "../../state/productStore";
// import ProductRow from "../ProductTable/ProductRow";

// export default function VirtualProductTable(): JSX.Element {
//   const parentRef = useRef<HTMLDivElement | null>(null);

//   // Zustand store
//   const products = useProductStore((s) => s.products);
//   const columns = useProductStore((s) => s.columns);

//   const rowHeight = 52;

//   const rowVirtualizer = useVirtualizer({
//     count: products.length,
//     getScrollElement: () => parentRef.current,
//     estimateSize: () => rowHeight,
//     overscan: 12,
//   });

//   const virtualItems = rowVirtualizer.getVirtualItems();

//   return (
//     <Card>
//       {/* Header */}
//       <Box padding="2" background="bg-subdued">
//         <div style={{ display: "flex", padding: "8px 12px", fontWeight: 600 }}>
//           <div style={{ width: 40 }}></div> {/* Checkbox column */}
//           {columns.map((col) => (
//             <div key={col} style={{ flex: 1 }}>
//               {col.toUpperCase()}
//             </div>
//           ))}
//           <div style={{ width: 80 }}>Actions</div>
//         </div>
//       </Box>

//       {/* Virtualized Body */}
//       <div
//         ref={parentRef}
//         style={{
//           height: "75vh",
//           overflow: "auto",
//           position: "relative",
//         }}
//       >
//         <div
//           style={{
//             height: `${rowVirtualizer.getTotalSize()}px`,
//             width: "100%",
//             position: "relative",
//           }}
//         >
//           {virtualItems.map((virtualRow) => {
//             const index = virtualRow.index;
//             const product = products[index];

//             return (
//               <div
//                 key={virtualRow.key}
//                 ref={rowVirtualizer.measureElement}
//                 style={{
//                   position: "absolute",
//                   top: 0,
//                   left: 0,
//                   width: "100%",
//                   transform: `translateY(${virtualRow.start}px)`,
//                 }}
//               >
//                 <ProductRow product={product} />
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </Card>
//   );
// }

// web/frontend/components/ProductPage/VirtualProductTable.tsx 

// web/frontend/components/ProductPage/VirtualProductTable.tsx

import { memo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Card,
  Box,
  InlineStack,
  Text,
  Spinner,
} from "@shopify/polaris";
import { useProductIds } from "../../stores/productStore";
import { useProductsInfinite } from "../../hooks/useProductsInfinite";
import { ProductRow } from "../ProductTable/ProductRow";

export const VirtualProductTable = memo(
  function VirtualProductTable() {
    const parentRef = useRef<HTMLDivElement | null>(null);

    // O(1) normalized access
    const productIds = useProductIds();

    // Data hook (LOCKED API)
    const { loadMore, hasNextPage } =
      useProductsInfinite();

    const rowVirtualizer = useVirtualizer({
      count: productIds.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 64, // safe approximation
      overscan: 10,
    });

    /* ---------------- Infinite Scroll ---------------- */
    useEffect(() => {
      const virtualItems =
        rowVirtualizer.getVirtualItems();
      if (!virtualItems.length) return;

      const lastItem =
        virtualItems[virtualItems.length - 1];

      if (
        lastItem.index >= productIds.length - 5 &&
        hasNextPage
      ) {
        loadMore();
      }
    }, [
      rowVirtualizer.getVirtualItems(),
      productIds.length,
      hasNextPage,
      loadMore,
    ]);

    return (
      <Card padding="0">
        {/* ---------------- Header ---------------- */}
        <Box
          padding="300"
          background="bg-surface-secondary"
          borderBlockEndWidth="025"
          borderColor="border"
        >
          <InlineStack
            gap="400"
            blockAlign="center"
            wrap={false}
          >
            <Box style={{ width: "48px" }} />

            <Box
              style={{ flex: 2, minWidth: "200px" }}
            >
              <Text
                as="span"
                fontWeight="semibold"
                variant="headingSm"
              >
                Product
              </Text>
            </Box>

            <Box style={{ width: "120px" }}>
              <Text
                as="span"
                fontWeight="semibold"
                variant="headingSm"
              >
                Status
              </Text>
            </Box>

            <Box
              style={{ flex: 1, minWidth: "120px" }}
            >
              <Text
                as="span"
                fontWeight="semibold"
                variant="headingSm"
              >
                Vendor
              </Text>
            </Box>
          </InlineStack>
        </Box>

        {/* ---------------- Virtual Scroll Area ---------------- */}
        <div
          ref={parentRef}
          style={{
            height: "calc(100vh - 220px)",
            overflowY: "auto",
            position: "relative",
            contain: "layout paint",
            willChange: "transform",
          }}
        >
          {/* Scroll Track */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
              width: "100%",
            }}
          >
            {rowVirtualizer
              .getVirtualItems()
              .map((virtualRow) => {
                const id =
                  productIds[virtualRow.index];
                if (!id) return null;

                return (
                  <ProductRow
                    key={id}
                    id={id}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px) translateZ(0)`,
                    }}
                  />
                );
              })}
          </div>

          {/* Bottom Loader */}
          {hasNextPage && (
            <Box
              padding="400"
              style={{ textAlign: "center" }}
            >
              <Spinner size="small" />
            </Box>
          )}
        </div>
      </Card>
    );
  }
);

// import { TextField, Box, Text } from "@shopify/polaris";
// import React, { useState } from "react";
// import { shallow } from "zustand/shallow";
// import { useProductStore } from "../../../state/productStore";
// import { useDebounce } from "../../../utils/useDebounce";

// /* ---------- Types ---------- */

// type InventoryMap = Record<string, number>;

// type InventoryEditorProps = {
//   id: string;
// };

// type LocationQtyInputProps = {
//   productId: string;
//   locationId: string;
//   initialQty: number;
//   updateField: (
//     productId: string,
//     fieldPath: string,
//     value: number
//   ) => void;
// };

// /* ---------- Components ---------- */

// function InventoryEditorComponent({
//   id,
// }: InventoryEditorProps): JSX.Element {
//   const inventory = useProductStore(
//     (s) => s.productMap[id]?.inventoryLocations as InventoryMap | undefined,
//     shallow
//   );

//   const updateField = useProductStore((s) => s.updateField);

//   if (!inventory) {
//     return <Text>-</Text>;
//   }

//   return (
//     <Box padding="100">
//       {Object.entries(inventory).map(([locId, qty]) => (
//         <LocationQtyInput
//           key={locId}
//           productId={id}
//           locationId={locId}
//           initialQty={qty}
//           updateField={updateField}
//         />
//       ))}
//     </Box>
//   );
// }

// function LocationQtyInput({
//   productId,
//   locationId,
//   initialQty,
//   updateField,
// }: LocationQtyInputProps): JSX.Element {
//   const [local, setLocal] = useState<number>(initialQty);
//   const debouncedUpdate = useDebounce(updateField, 200);

//   const onChange = (value: string): void => {
//     const numeric = Number(value);
//     setLocal(numeric);
//     debouncedUpdate(
//       productId,
//       `inventoryLocations.${locationId}`,
//       numeric
//     );
//   };

//   return (
//     <Box paddingBlock="100">
//       <Text as="span" variant="bodySm">
//         {locationId}
//       </Text>

//       <TextField
//         label=""
//         type="number"
//         value={String(local)}
//         onChange={onChange}
//       />
//     </Box>
//   );
// }

// export default React.memo(InventoryEditorComponent);


// web/frontend/components/ProductEditors/InventoryEditor.tsx

import { memo, useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Text,
  TextField,
  Spinner,
  InlineStack,
} from "@shopify/polaris";
import { useInventoryForProduct } from "../../../hooks/useInventoryForProduct";
import { useDebouncedCallback } from "use-debounce";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

interface InventoryEditorProps {
  productId: string;
}

interface InventoryItem {
  variantId: string;
  locationId: string;
  quantity: number;
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export const InventoryEditor = memo(
  ({ productId }: InventoryEditorProps) => {
    const { items, loading, updateQuantity } =
      useInventoryForProduct(productId);

    if (loading) {
      return (
        <Box padding="400" minHeight="50px">
          <InlineStack align="center">
            <Spinner size="small" />
          </InlineStack>
        </Box>
      );
    }

    if (!items || items.length === 0) {
      return (
        <Box padding="200">
          <Text as="p" tone="subdued">
            No inventory tracked
          </Text>
        </Box>
      );
    }

    return (
      <Box padding="200">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {items.map((item) => (
            <InventoryQtyInput
              key={`${item.variantId}:${item.locationId}`}
              item={item}
              onCommit={updateQuantity}
            />
          ))}
        </div>
      </Box>
    );
  }
);

InventoryEditor.displayName = "InventoryEditor";

/* ------------------------------------------------------------------ */
/* Sub-component (Zero-lag, debounced input) */
/* ------------------------------------------------------------------ */

interface InventoryQtyInputProps {
  item: InventoryItem;
  onCommit: (
    variantId: string,
    locationId: string,
    quantity: number
  ) => void;
}

const InventoryQtyInput = memo(
  ({ item, onCommit }: InventoryQtyInputProps) => {
    const [localValue, setLocalValue] = useState(
      String(item.quantity)
    );
    const isEditingRef = useRef(false);

    /* ---------------- Sync from backend ---------------- */
    useEffect(() => {
      if (!isEditingRef.current) {
        setLocalValue(String(item.quantity));
      }
    }, [item.quantity]);

    /* ---------------- Debounced commit ---------------- */
    const debouncedCommit = useDebouncedCallback(
      (val: string) => {
        const num = Number(val);
        if (
          Number.isInteger(num) &&
          num >= 0 &&
          num <= 10_000_000 // safety cap
        ) {
          onCommit(item.variantId, item.locationId, num);
        }
      },
      500
    );

    /* ---------------- Handlers ---------------- */
    const handleChange = useCallback(
      (value: string) => {
        isEditingRef.current = true;
        setLocalValue(value);
        debouncedCommit(value);
      },
      [debouncedCommit]
    );

    const handleBlur = useCallback(() => {
      isEditingRef.current = false;
      debouncedCommit.flush();
    }, [debouncedCommit]);

    useEffect(() => {
      return () => {
        debouncedCommit.cancel();
      };
    }, [debouncedCommit]);

    /* ---------------- Render ---------------- */
    return (
      <Box
        borderWidth="025"
        borderColor="border-subdued"
        padding="200"
        borderRadius="200"
      >
        <InlineStack
          align="space-between"
          blockAlign="center"
        >
          <Text
            as="span"
            variant="bodySm"
            tone="subdued"
          >
            Location {item.locationId.slice(-4)}…
          </Text>

          <div style={{ width: "80px" }}>
            <TextField
              label="Quantity"
              labelHidden
              type="number"
              value={localValue}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="off"
              align="right"
              min={0}
            />
          </div>
        </InlineStack>
      </Box>
    );
  },
  (prev, next) =>
    prev.item.variantId === next.item.variantId &&
    prev.item.locationId === next.item.locationId &&
    prev.item.quantity === next.item.quantity
);

InventoryQtyInput.displayName = "InventoryQtyInput";

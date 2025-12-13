// import { TextField } from "@shopify/polaris";
// import React from "react";
// import { useProductStore } from "../../../state/productStore";

// type Product = {
//   id: string;
//   price: number;
// };

// type InlinePriceEditorProps = {
//   product: Product;
// };

// export default function InlinePriceEditor({
//   product,
// }: InlinePriceEditorProps): JSX.Element {
//   const update = useProductStore((s) => s.updateProductPrice);

//   const handleChange = (value: string): void => {
//     update(product.id, Number(value));
//   };

//   return (
//     <TextField
//       label=""
//       type="number"
//       value={String(product.price)}
//       onChange={handleChange}
//     />
//   );
// }


/// web/frontend/components/ProductPage/InlineEditors/PriceEditor.tsx

import { memo, useState, useEffect, useCallback, useRef } from "react";
import { TextField } from "@shopify/polaris";
import { useProductStore } from "../../../stores/productStore";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

interface InlinePriceEditorProps {
  id: string;
  initialPrice: string; // Shopify decimal string
  currencyCode?: string;
}

/* ------------------------------------------------------------------ */
/* Utils */
/* ------------------------------------------------------------------ */

function normalizePrice(value: string): string | null {
  if (value.trim() === "") return null;

  const num = Number(value);
  if (
    !Number.isFinite(num) ||
    num < 0 ||
    num > 1_000_000 // safety cap
  ) {
    return null;
  }

  // Shopify accepts max 2 decimals
  return num.toFixed(2);
}

function getCurrencyPrefix(code: string) {
  switch (code) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export const InlinePriceEditor = memo(
  ({
    id,
    initialPrice,
    currencyCode = "USD",
  }: InlinePriceEditorProps) => {
    const updateField = useProductStore(
      (s) => s.updateField
    );

    // Local state for instant typing
    const [value, setValue] = useState(initialPrice);

    // Editing lock (prevents store sync clobber)
    const isEditingRef = useRef(false);

    /* ---------------- Sync from Store ---------------- */
    useEffect(() => {
      if (!isEditingRef.current) {
        setValue(initialPrice);
      }
    }, [initialPrice]);

    /* ---------------- Commit ---------------- */
    const commitChange = useCallback(() => {
      isEditingRef.current = false;

      const normalized = normalizePrice(value);

      if (
        normalized !== null &&
        normalized !== initialPrice
      ) {
        updateField(id, "price", normalized);
      } else {
        // Revert invalid or unchanged input
        setValue(initialPrice);
      }
    }, [value, initialPrice, id, updateField]);

    /* ---------------- Handlers ---------------- */
    const handleChange = useCallback(
      (newValue: string) => {
        isEditingRef.current = true;
        setValue(newValue);
      },
      []
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          (e.target as HTMLElement).blur();
        }
      },
      []
    );

    /* ---------------- Render ---------------- */
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <TextField
          label="Price"
          aria-label="Product price"
          labelHidden
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onBlur={commitChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          align="right"
          prefix={getCurrencyPrefix(currencyCode)}
          step="0.01"
        />
      </div>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.initialPrice === next.initialPrice &&
    prev.currencyCode === next.currencyCode
);

InlinePriceEditor.displayName = "InlinePriceEditor";



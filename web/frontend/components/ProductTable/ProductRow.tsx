// web/frontend/src/components/ProductRow.tsx
import { memo, useCallback } from "react";
import {
  Checkbox,
  Stack,
  Thumbnail,
  Text,
  Badge,
} from "@shopify/polaris";

import { useSelectionStore } from "../../state/selectionStore";
import type { ProductSummary } from "../../types/product";

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

interface ProductRowProps {
  product: ProductSummary;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export const ProductRow = memo(
  function ProductRow({
    product,
  }: ProductRowProps): JSX.Element {
    const checked = useSelectionStore(
      state =>
        state.mode === "all" ||
        state.selectedIds.has(product.id)
    );

    const { selectOne, deselectOne } =
      useSelectionStore(state => ({
        selectOne: state.selectOne,
        deselectOne: state.deselectOne,
      }));

    const handleToggle = useCallback(
      (value: boolean) => {
        value
          ? selectOne(product.id)
          : deselectOne(product.id);
      },
      [product.id, selectOne, deselectOne]
    );

    return (
      <Stack
        align="center"
        gap="400"
        style={{
          height: 72,
          overflow: "hidden",
        }}
      >
        <Checkbox
          checked={checked}
          onChange={handleToggle}
        />

        <Thumbnail
          source={product.featuredImage?.url}
          alt={product.featuredImage?.altText ?? ""}
          size="small"
        />

        <Text
          fontWeight="semibold"
          truncate
        >
          {product.title}
        </Text>

        <Badge>{product.status}</Badge>

        <Text
          tone="subdued"
          truncate
        >
          {product.vendor}
        </Text>
      </Stack>
    );
  }
);

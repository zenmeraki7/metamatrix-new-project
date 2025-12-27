import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Spinner,
  Text,
  IndexTable,
  Badge,
  Thumbnail
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

import { FilterBuilder } from "../components/Filterss/FilterBuilder";
import { useFilterState } from "../filters/useFilterState";
import { fetchProducts as fetchProductsApi } from "../filters/api";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Product = {
  id: string;
  title: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED" | string;
  price?: number;
   image?: string | null;
};

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function Products() {
  const { dsl, hasFilters, clearAll } = useFilterState();

  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Fetch logic                                                        */
  /* ------------------------------------------------------------------ */

  const loadProducts = useCallback(
    async (mode: "reset" | "next" = "reset") => {
      setLoading(true);

      try {
        const res = await fetchProductsApi({
          filter: hasFilters ? dsl : undefined,
          cursor: mode === "next" ? cursor : null,
          limit: 25,
        });

        setProducts((prev) =>
          mode === "reset" ? res.items : [...prev, ...res.items]
        );

        setCursor(res.pageInfo.endCursor);
        setHasNextPage(res.pageInfo.hasNextPage);
      } finally {
        setLoading(false);
      }
    },
    [dsl, hasFilters, cursor]
  );

  /* ------------------------------------------------------------------ */
  /* Refetch on filter change                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    loadProducts("reset");
  }, [dsl]);

  /* ------------------------------------------------------------------ */
  /* Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <Page
      title="Products"
      primaryAction={{
        content: "Clear filters",
        onAction: clearAll,
        disabled: !hasFilters,
      }}
    >
      <BlockStack gap="400">
        {/* ---------------- Filters ---------------- */}
        <Card>
          <FilterBuilder />
        </Card>

        {/* ---------------- Products Table ---------------- */}
        <Card padding="0">
          {loading && products.length === 0 ? (
            <BlockStack align="center" inlineAlignment="center" padding="500">
              <Spinner />
            </BlockStack>
          ) : products.length === 0 ? (
            <BlockStack align="center" inlineAlignment="center" padding="500">
              <Text tone="subdued">No products found</Text>
            </BlockStack>
          ) : (
            <IndexTable
              resourceName={{ singular: "product", plural: "products" }}
              itemCount={products.length}
              selectable={false}
              headings={[
                  { title: "" },
                { title: "Product" },
                { title: "Status" },
                { title: "Price" },
              ]}
            >
              {products.map((p, index) => (
  <IndexTable.Row id={p.id} key={p.id} position={index}>
    {/* Image */}
    <IndexTable.Cell>
      <Thumbnail
        source={p.image || ""}
        alt={p.title}
        size="small"
      />
    </IndexTable.Cell>

    {/* Title */}
    <IndexTable.Cell>
      <Text variant="bodyMd" fontWeight="semibold">
        {p.title}
      </Text>
    </IndexTable.Cell>

    {/* Status */}
    <IndexTable.Cell>
      <Badge
        tone={
          p.status === "ACTIVE"
            ? "success"
            : p.status === "DRAFT"
            ? "info"
            : "warning"
        }
      >
        {p.status}
      </Badge>
    </IndexTable.Cell>

    {/* Price */}
    <IndexTable.Cell>
      <Text>
        {p.price != null ? `₹${p.price}` : "-"}
      </Text>
    </IndexTable.Cell>
  </IndexTable.Row>
))}

            </IndexTable>
          )}
        </Card>

        {/* ---------------- Pagination ---------------- */}
        {hasNextPage && (
          <InlineStack align="center">
            <Button
              loading={loading}
              onClick={() => loadProducts("next")}
            >
              Load more
            </Button>
          </InlineStack>
        )}
      </BlockStack>
    </Page>
  );
}

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
  Thumbnail,
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
  vendor: string;
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

      const normalized = res.items.map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        vendor: p.vendor,
        image:
          p.image ||
          p.featuredImage?.url ||
          p.images?.edges?.[0]?.node?.url ||
          null,
      }));

      setProducts((prev) =>
        mode === "reset" ? normalized : [...prev, ...normalized]
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
console.log("DSL SENT TO API", dsl);

  /* ------------------------------------------------------------------ */
  /* Render                                                            */
  /* ------------------------------------------------------------------ */

const handleClearFilters = async () => {
  clearAll();
  setFiltersOpen(false);
  setCursor(null);
  setHasNextPage(true);
  setProducts([]);
  await loadProducts("reset");
};


  return (
   <Page
  title="Products"
  primaryAction={{
    content: "Clear filters",
    onAction: handleClearFilters,
  }}
  secondaryActions={[
    {
      content: `Filters${hasFilters ? " (1)" : ""}`,
      onAction: () => setFiltersOpen((v) => !v),
    },
  ]}
>

      <BlockStack gap="400">
        {/* ---------------- Filters ---------------- */}
{filtersOpen && (
  <Card>
    <FilterBuilder
      onProductsFetched={(data) => {
  const normalized = data.items.map((p: any) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    vendor: p.vendor,
    image:
      p.image ||
      p.featuredImage?.url ||
      p.images?.edges?.[0]?.node?.url ||
      null,
  }));

  setProducts(normalized);
  setCursor(data.pageInfo.endCursor);
  setHasNextPage(data.pageInfo.hasNextPage);
}}

      onClose={() => setFiltersOpen(false)}
    />
  </Card>
)}


        {/* ---------------- Products Table ---------------- */}
        <Card padding="0">
          {loading && products.length === 0 ? (
            <BlockStack align="center" inlineAlignment="center" padding="500">
              <Spinner />
            </BlockStack>
          ) : products.length === 0 ? (
            <BlockStack align="center" inlineAlignment="center" padding="500">
              <Text as="p" tone="subdued">No products found</Text>
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
                { title: "Vendor" },
              ]}
            >
              {products.map((p, index) => (
                <IndexTable.Row id={p.id} key={p.id} position={index}>
                  {/* Image */}
                  <IndexTable.Cell>
                    <Thumbnail
  source={p.image || "https://cdn.shopify.com/s/images/admin/no-image-large.gif"}
  alt={p.title}
  size="small"
/>

                  </IndexTable.Cell>

                  {/* Title */}
                  <IndexTable.Cell>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
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

                  {/* Vendor */}
                  <IndexTable.Cell>
                    <Text as="p">{p.vendor}</Text>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
        </Card>

        {/* ---------------- Pagination ---------------- */}
        {hasNextPage && (
          <InlineStack align="center">
            <Button loading={loading} onClick={() => loadProducts("next")}>
              Load more
            </Button>
          </InlineStack>
        )}
      </BlockStack>
    </Page>
  );
}

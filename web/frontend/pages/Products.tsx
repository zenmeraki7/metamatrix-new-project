// web/frontend/src/pages/Products.tsx
import { memo, useState, useCallback } from "react";
import {
  Page,
  Card,
  Stack,
} from "@shopify/polaris";

import { useProductsPage } from "../hooks/useProductsPage";
import { VirtualizedProductList } from "../components/ProductTable/VirtualizedProductList";
import { ProductsTopBar } from "../components/ProductTable/ProductsTopBar";
import { ProductsPagination } from "../components/ProductTable/ProductsPagination";
import { FiltersModal } from "../components/filters/FilterModal";


/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

const Products = memo(function Products(): JSX.Element {
  const {
    products,
    pageInfo,
    isLoading,
    loadNext,
    loadPrev,
  } = useProductsPage();

  /* -------------------------------------------------------------- */
  /* UI State (local only)                                          */
  /* -------------------------------------------------------------- */

  const [search, setSearch] = useState<string>("");
  const [filterOpen, setFilterOpen] =
    useState<boolean>(false);

  /* -------------------------------------------------------------- */
  /* Stable handlers                                                */
  /* -------------------------------------------------------------- */

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
    },
    []
  );

  const handleFilterClick = useCallback(() => {
    setFilterOpen(true);
  }, []);

  /* -------------------------------------------------------------- */
  /* Render                                                         */
  /* -------------------------------------------------------------- */

  return (
    <Page title="Products">
  <Stack vertical spacing="extraLoose"> 
    {/* Top Bar */}
    <Card>
      <ProductsTopBar
        searchValue={search}
        onSearchChange={handleSearchChange}
        onFilterClick={handleFilterClick}
      />
    </Card>

    {/* Product List */}
    <Card padding="0">
      {products.length > 0 ? (
        <VirtualizedProductList
          products={products}
          loading={isLoading}
          onLoadMore={loadNext}
        />
      ) : (
        <div style={{ padding: 20 }}>
          {isLoading ? "Loading products..." : "No products found"}
        </div>
      )}
    </Card>

    {/* Pagination */}
    <Card>
      <ProductsPagination
        pageInfo={pageInfo}
        onNext={loadNext}
        onPrev={loadPrev}
      />
    </Card>
  </Stack>

  {/* Filters Modal */}
  <FiltersModal
    open={filterOpen}
    executionPhase="search"
    onClose={() => setFilterOpen(false)}
    onApply={(rules) => {
      console.log("Filters:", rules);
      setFilterOpen(false);
    }}
  />
</Page>

  );
});

export default Products;

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
      <Stack gap="400">
        <Card>
          <ProductsTopBar
            searchValue={search}
            onSearchChange={handleSearchChange}
            onFilterClick={handleFilterClick}
          />
        </Card>

        <Card padding="0">
          <VirtualizedProductList
            products={products}
            loading={isLoading}
          />
        </Card>

        <Card>
          <ProductsPagination
            pageInfo={pageInfo}
            onNext={loadNext}
            onPrev={loadPrev}
          />
        </Card>
      </Stack>

      <FiltersModal
        open={filterOpen}
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

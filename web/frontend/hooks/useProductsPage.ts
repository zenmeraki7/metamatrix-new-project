// web/frontend/src/hooks/useProductsPage.ts
import {
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ProductSummary } from "../../../types/product";

type Direction = "next" | "prev";

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface ProductsResponse {
  products: (ProductSummary & { cursor: string })[];
  pageInfo: PageInfo;
}

export function useProductsPage() {
  const [products, setProducts] =
    useState<ProductSummary[]>([]);
  const [pageInfo, setPageInfo] =
    useState<PageInfo | null>(null);
  const [cursor, setCursor] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] =
    useState<boolean>(false);

  /* -------------------------------------------------------------- */
  /* Core fetch                                                     */
  /* -------------------------------------------------------------- */

  const fetchPage = useCallback(
    async (direction: Direction) => {
      setIsLoading(true);

      const params = new URLSearchParams();
      params.set("direction", direction);
      if (cursor) params.set("cursor", cursor);

      let res: Response;
      try {
        res = await fetch(
          `/api/products?${params.toString()}`,
          { method: "GET" }
        );
      } catch {
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setIsLoading(false);
        return;
      }

      let data: ProductsResponse;
      try {
        data = (await res.json()) as ProductsResponse;
      } catch {
        setIsLoading(false);
        return;
      }

      setProducts(data.products);
      setPageInfo(data.pageInfo);

      if (direction === "next") {
        setCursor(data.pageInfo.endCursor);
      } else {
        setCursor(data.pageInfo.startCursor);
      }

      setIsLoading(false);
    },
    [cursor]
  );

  /* -------------------------------------------------------------- */
  /* Initial load                                                   */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    fetchPage("next");
  }, [fetchPage]);

  return {
    products,
    pageInfo,
    isLoading,
    loadNext: () => fetchPage("next"),
    loadPrev: () => fetchPage("prev"),
  };
}

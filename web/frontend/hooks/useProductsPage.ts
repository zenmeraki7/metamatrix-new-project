import { useState, useEffect, useCallback, useRef } from "react";
import type { ProductSummary } from "../../frontend/types/product";

type Direction = "next" | "prev";

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface ProductsResponse {
  products: ProductSummary[];
  pageInfo: PageInfo;
}

export function useProductsPage(filterDsl?: any) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

     const isFirstLoad = useRef(true); // ✅ HERE

  const fetchPage = useCallback(
    async (direction: Direction) => {
      setIsLoading(true);

      const hasFilters = filterDsl?.and?.length > 0;

      try {
        let res: Response;

        if (hasFilters) {
          res = await fetch("/api/products/search", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filterDsl,
              limit: 50,
            }),
          });
        } else {
          const params = new URLSearchParams();
          params.set("direction", direction);
          if (cursor) params.set("cursor", cursor);

          res = await fetch(`/api/products?${params.toString()}`, {
            credentials: "include",
          });
        }

        if (!res.ok) throw new Error("Failed to fetch");

        const data: ProductsResponse = await res.json();

        setProducts(data.products);
        setPageInfo(data.pageInfo);

        if (!hasFilters) {
          setCursor(
            direction === "next"
              ? data.pageInfo.endCursor
              : data.pageInfo.startCursor
          );
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [cursor, filterDsl]
  );

  // ✅ Initial load (no filters)
useEffect(() => {
  setCursor(null);
  fetchPage("next");
}, [filterDsl, fetchPage]); // ✅ MUST include fetchPage


  // ✅ THIS IS THE ONE YOU ASKED ABOUT
  // Reset pagination when filters change
  useEffect(() => {
    setCursor(null);
    fetchPage("next");
  }, [filterDsl]); // 👈 HERE

  return {
    products,
    pageInfo,
    isLoading,
    loadNext: () => fetchPage("next"),
    loadPrev: () => fetchPage("prev"),
  };
}



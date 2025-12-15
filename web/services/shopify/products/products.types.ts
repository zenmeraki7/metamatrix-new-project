/* ---------------- Shopify response ---------------- */

export interface ShopifyProductsQuery {
  products: {
    edges: {
      cursor: string;
      node: {
        id: string;
        title: string;
        handle: string;
        vendor: string;
        status: string;
        featuredImage?: {
          url: string;
        } | null;
      };
    }[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

/* ---------------- Domain model ---------------- */

export interface Product {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  status: string;
  image?: string;
}

export interface ProductsResult {
  products: Product[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  cursor: string | null;
}

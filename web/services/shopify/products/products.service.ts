interface FetchProductsParams {
  ctx: ShopifyJobContext;
  limit: number;
  direction: "next" | "prev";
  cursor?: string;
  search?: string;
}

export async function fetchProducts({
  ctx,
  limit,
  direction,
  cursor,
  search,
}: FetchProductsParams) {
  const isNext = direction === "next";

  const data = await shopifyGraphQL<
    ShopifyProductsQuery,
    {
      first?: number;
      last?: number;
      after?: string;
      before?: string;
      query?: string;
    }
  >({
    ctx,
    query: PRODUCTS_QUERY,
    variables: {
      first: isNext ? limit : undefined,
      last: !isNext ? limit : undefined,
      after: isNext ? cursor ?? undefined : undefined,
      before: !isNext ? cursor ?? undefined : undefined,
      query: search
        ? `title:*${search}*`
        : undefined,
    },
  });

  const edges = data.products.edges;

  return {
    products: edges.map(({ node, cursor }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      vendor: node.vendor,
      status: node.status,
      image: node.featuredImage?.url,
      cursor,
    })),
    pageInfo: {
      hasNextPage:
        data.products.pageInfo.hasNextPage,
      hasPreviousPage:
        data.products.pageInfo.hasPreviousPage,
      startCursor:
        edges.length > 0
          ? edges[0].cursor
          : null,
      endCursor:
        edges.length > 0
          ? edges[edges.length - 1].cursor
          : null,
    },
  };
}

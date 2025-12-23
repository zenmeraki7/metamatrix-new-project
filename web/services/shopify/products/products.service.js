import { shopifyGraphQL } from "../services/shopify/graphqlClient.js";
import { PRODUCTS_QUERY } from "../routes/products.query.js";

export async function fetchProducts({
  ctx,
  limit,
  direction,
  cursor,
  search,
}) {
  const isNext = direction === "next";

  const data = await shopifyGraphQL({
    ctx,
    query: PRODUCTS_QUERY,
    variables: {
      first: isNext ? limit : undefined,
      last: !isNext ? limit : undefined,
      after: isNext ? cursor ?? undefined : undefined,
      before: !isNext ? cursor ?? undefined : undefined,
      query: search ? `title:*${search}*` : undefined,
    },
  });

  const edges = data.products.edges;

  return {
    products: edges.map(({ node, cursor }) => {
      const firstVariant =
        node.variants?.edges?.[0]?.node ?? null;

      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        vendor: node.vendor,
        status: node.status,
        image: node.featuredImage?.url ?? null,

        // ✅ PRICE FIX
        price: firstVariant
          ? Number(firstVariant.price)
          : null,

        compareAtPrice: firstVariant?.compareAtPrice
          ? Number(firstVariant.compareAtPrice)
          : null,

        cursor,
      };
    }),

    pageInfo: {
      hasNextPage: data.products.pageInfo.hasNextPage,
      hasPreviousPage: data.products.pageInfo.hasPreviousPage,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  };
}


// web/routes/products.query.ts
export const PRODUCTS_QUERY = `
query ProductsPage(
  $first: Int
  $last: Int
  $after: String
  $before: String
  $query: String
) {
  products(
    first: $first
    last: $last
    after: $after
    before: $before
    query: $query
    sortKey: UPDATED_AT
    reverse: true
  ) {
    edges {
      cursor
      node {
        id
        title
        handle
        status
        vendor
        featuredImage {
          url
          altText
        }
        variants(first: 1) {
          edges {
            node {
              id
              price
              compareAtPrice
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
`;


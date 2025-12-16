export const PRODUCTS_QUERY = `
  query Products(
    $first: Int!
    $after: String
    $query: String
  ) {
    products(
      first: $first
      after: $after
      query: $query
    ) {
      edges {
        cursor
        node {
          id
          title
          handle
          vendor
          status
          featuredImage {
            url
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

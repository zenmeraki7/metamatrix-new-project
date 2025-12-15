// web/backend/routes/products.ts (or index.js)
app.get("/api/products", async (req, res) => {
  const { direction = "next", cursor } = req.query;

  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  // Shopify GraphQL query
  const query = `
    query fetchProducts($first: Int, $after: String, $last: Int, $before: String) {
      products(first: $first, after: $after, last: $last, before: $before) {
        edges {
          cursor
          node {
            id
            title
            handle
            vendor
            tags
            featuredImage {
              url
              altText
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price
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

  const variables: any = direction === "next"
    ? { first: 10, after: cursor || null }
    : { last: 10, before: cursor || null };

  try {
    const data = await client.query({ data: { query, variables } });
    const edges = data.body.data.products.edges;

    const products = edges.map(edge => ({
      ...edge.node,
      cursor: edge.cursor,
      price: edge.node.variants.edges[0]?.node.price || "0.00",
      featuredImageUrl: edge.node.featuredImage?.url || null,
    }));

    res.status(200).json({
      products,
      pageInfo: data.body.data.products.pageInfo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

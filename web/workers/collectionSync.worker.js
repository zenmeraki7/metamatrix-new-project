import { Worker } from "bullmq";
import shopify from "../shopify.js";
import { Collection } from "../models/index.js";
import { connection } from "../queues/redis.js";

const COLLECTIONS_QUERY = `
  query collections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          updatedAt
          ruleSet {
            rules {
              column
              relation
              condition
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

new Worker(
  "collection-sync",
  async (job) => {
    const { shop, accessToken, shopId } = job.data;

    console.log("📦 Collection sync started:", shop);

    const client = new shopify.api.clients.Graphql({
      session: { shop, accessToken },
    });

    let cursor = null;
    let hasNextPage = true;

while (hasNextPage) {
  try {
    console.log("📡 Fetching collections, cursor:", cursor);

    const res = await client.request(COLLECTIONS_QUERY, {
      variables: { first: 100, after: cursor },
    });

    console.log("✅ Shopify response received");

    const { edges, pageInfo } = res.data.collections;
    console.log(`📦 Collections fetched: ${edges.length}`);

    for (const { node } of edges) {
      try {
        await Collection.updateOne(
          { shopId, shopifyCollectionId: node.id },
          {
            $set: {
              shopId,
              shopifyCollectionId: node.id,
              title: node.title,
              handle: node.handle,
              descriptionHtml: node.descriptionHtml,
              type: node.ruleSet?.rules?.length ? "SMART" : "CUSTOM",
              rules: node.ruleSet || null,
              shopifyUpdatedAt: new Date(node.updatedAt),
              syncedAt: new Date(),
            },
          },
          { upsert: true }
        );
        console.log(`✅ Collection saved: ${node.title}`);
      } catch (dbErr) {
        console.error("❌ Error saving collection:", node.id, dbErr);
      }
    }

    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;
  } catch (err) {
    console.error("🔥 Error fetching collections:", err);
    break;
  }
}
    console.log("✅ Collection sync completed");
  },
  { connection }
);

import { Worker } from "bullmq";
import fetch from "node-fetch";
import { Product } from "../models/index.js";
import  {connection}  from "../queus/redis.js";

export const worker = new Worker(
  "product-sync",
  async (job) => {
    const { shop, accessToken } = job.data;

    console.log("🚀 Starting product sync");
    console.log("🏪 Shop:", shop);
    console.log("🆔 Job ID:", job.id);

    let hasNextPage = true;
    let cursor = null;
    let page = 1;
    let totalSynced = 0;

    while (hasNextPage) {
      console.log(`📄 Fetching page ${page}`);

      const query = `
        query ($cursor: String) {
          products(first: 50, after: $cursor) {
            edges {
              cursor
              node {
                id
                handle
                title
                vendor
                status
                featuredImage {
                  id
                  url
                  altText
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;

      const response = await fetch(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({ query, variables: { cursor } }),
        }
      );

      console.log("📡 Shopify response:", response.status);

      const json = await response.json();

      if (json.errors) {
        console.error("❌ GraphQL errors:", json.errors);
        throw new Error("Shopify GraphQL error");
      }

      const products = json.data.products.edges;
      console.log(`📦 Products fetched: ${products.length}`);

      for (const { node } of products) {
        console.log("🔄 Syncing:", node.title);

        await Product.findOneAndUpdate(
          { shopifyProductId: node.id },
          {
            shopifyProductId: node.id,
            handle: node.handle,
            title: node.title,
            vendor: node.vendor,
            status: node.status,
            featuredMedia: node.featuredImage
              ? {
                  url: node.featuredImage.url,
                  id: node.featuredImage.id || "",
                  alt: node.featuredImage.altText || "",
                }
              : {},
            syncedAt: new Date(),
          },
          { upsert: true }
        );

        totalSynced++;
      }

      hasNextPage = json.data.products.pageInfo.hasNextPage;
      cursor = products.length
        ? products[products.length - 1].cursor
        : null;

      page++;
    }

    // 👇 Returned value is available in `completed` event
    return {
      shop,
      totalSynced,
      completedAt: new Date(),
    };
  },
  { connection }

);
worker.on("completed", (job, result) => {
  console.log("🎉 Product sync completed");
  console.log("🆔 Job ID:", job.id);
  console.log("🏪 Shop:", result.shop);
  console.log("📊 Total products synced:", result.totalSynced);
});
worker.on("failed", (job, err) => {
  console.error("🔥 Product sync failed");
  console.error("🆔 Job ID:", job?.id);
  console.error("🏪 Shop:", job?.data?.shop);
  console.error("💥 Error:", err.message);
});


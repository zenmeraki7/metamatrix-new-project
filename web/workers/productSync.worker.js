// workers/productSync.worker.js
import { Worker } from "bullmq";
import { Types } from "mongoose";
import fetch from "node-fetch";
import { Product } from "../models/index.js";
import { connection } from "../queues/redis.js";

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`⚠️ Fetch failed (attempt ${attempt}), retrying...`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

export const worker = new Worker(
  "product-sync",
  async (job) => {
    const { shop, accessToken, shopId } = job.data;

    // ✅ MOVE DEBUG LOGS AFTER mongoShopId DECLARATION
    const mongoShopId = new Types.ObjectId(shopId);

    console.log("🚀 Starting product sync");
    console.log("🏪 Shop:", shop);
    console.log("🆔 Job ID:", job.id);
    console.log("🏢 Shop ID:", shopId);
    console.log("🔍 MongoDB ObjectId:", mongoShopId);

    let hasNextPage = true;
    let cursor = null;
    let page = 1;
    let totalSynced = 0;
    let productsWithCollections = 0;

    const query = `
      query ($cursor: String) {
        products(first: 50, after: $cursor) {
          edges {
            cursor
            node {
              id
              handle
              title
              description
              vendor
              status
              productType
              tags
              totalInventory
              createdAt
              updatedAt
              publishedAt
              featuredImage {
                id
                url
                altText
              }
              
              collections(first: 250) {
                edges {
                  node {
                    id
                  }
                }
              }
              
              variants(first: 50) {
                edges {
                  node {
                    id
                    sku
                    barcode
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    while (hasNextPage) {
      console.log(`📄 Fetching page ${page}`);

      const response = await fetchWithRetry(
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

      const bulkOps = products.map(({ node }) => {
        const shopifyProductId = node.id.replace(
          "gid://shopify/Product/",
          ""
        );

        const collectionIds =
          node.collections?.edges?.map(edge => edge.node.id) || [];

        if (collectionIds.length > 0) {
          productsWithCollections++;
        }

        return {
          updateOne: {
            filter: {
              shopId: mongoShopId,
              shopifyProductId,
            },
            update: {
              $set: {
                handle: node.handle || "",
                title: node.title || "",
                description: node.description || "",
                vendor: node.vendor || "",
                status: node.status || "DRAFT",
                productType: node.productType || "",
                tags: Array.isArray(node.tags) ? node.tags : [],
                collectionIds,
                totalInventory: node.totalInventory ?? 0,
                updatedAt: new Date(node.updatedAt),
                publishedAt: node.publishedAt
                  ? new Date(node.publishedAt)
                  : null,
                featuredMedia: node.featuredImage
                  ? {
                      id: node.featuredImage.id || "",
                      url: node.featuredImage.url,
                      alt: node.featuredImage.altText || "",
                    }
                  : null,
                variants:
                  node.variants?.edges?.map(({ node: v }) => ({
                    shopifyVariantId: v.id.replace(
                      "gid://shopify/ProductVariant/",
                      ""
                    ),
                    sku: v.sku || "",
                    barcode: v.barcode || "",
                    price: v.price ? Number(v.price) : 0,
                    inventoryQuantity: v.inventoryQuantity ?? 0,
                  })) || [],
                syncedAt: new Date(),
              },
              $setOnInsert: {
                shopId: mongoShopId,
                shopifyProductId,
                createdAt: new Date(node.createdAt),
              },
            },
            upsert: true,
          },
        };
      });

      if (bulkOps.length) {
        await Product.bulkWrite(bulkOps, { ordered: false });
        totalSynced += bulkOps.length;
        console.log(`✅ Synced ${bulkOps.length} products`);
      }

      hasNextPage = json.data.products.pageInfo.hasNextPage;
      cursor = products.length
        ? products[products.length - 1].cursor
        : null;

      page++;

      if (hasNextPage) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    console.log(`\n📊 SYNC SUMMARY:`);
    console.log(`   Total synced: ${totalSynced}`);
    console.log(`   Products with collections: ${productsWithCollections}`);
    console.log(`   Products without collections: ${totalSynced - productsWithCollections}`);

    return { shop, totalSynced, productsWithCollections };
  },
  {
    connection,
    concurrency: 1,
  }
);

worker.on("completed", (job, result) => {
  console.log("🎉 Product sync completed:", result);
});

worker.on("failed", (job, err) => {
  console.error("🔥 Product sync failed", err);
});
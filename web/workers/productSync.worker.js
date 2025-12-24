// workers/productSync.worker.js
import { Worker } from "bullmq";
import { Types } from "mongoose";
import fetch from "node-fetch";
import { Product } from "../models/index.js";
import { connection } from "../queues/redis.js"; // ✅ Fixed typo

export const worker = new Worker(
  "product-sync",
  async (job) => {
    const { shop, accessToken, shopId } = job.data; // ✅ Get shopId

    console.log("🚀 Starting product sync");
    console.log("🏪 Shop:", shop);
    console.log("🆔 Job ID:", job.id);
    console.log("🏢 Shop ID:", shopId);

    // ✅ Convert to ObjectId
    const mongoShopId = new Types.ObjectId(shopId);

    let hasNextPage = true;
    let cursor = null;
    let page = 1;
    let totalSynced = 0;

    while (hasNextPage) {
      console.log(`📄 Fetching page ${page}`);

      // ✅ Enhanced query with ALL needed fields
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
                variants(first: 100) {
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

      // ✅ Batch upsert for better performance
      const bulkOps = products.map(({ node }) => {
        const shopifyId = node.id.replace("gid://shopify/Product/", "");

        return {
          updateOne: {
            filter: {
              shopId: mongoShopId, // ✅ Include shopId in filter
              shopifyProductId: shopifyId,
            },
            update: {
              $set: {
                shopId: mongoShopId, // ✅ Always set shopId
                shopifyProductId: shopifyId,
                handle: node.handle || "",
                title: node.title || "",
                description: node.description || "",
                vendor: node.vendor || "",
                status: node.status || "DRAFT",
                productType: node.productType || "",
                tags: Array.isArray(node.tags) ? node.tags : [],
                totalInventory: node.totalInventory ?? 0,
                createdAt: node.createdAt ? new Date(node.createdAt) : new Date(),
                updatedAt: node.updatedAt ? new Date(node.updatedAt) : new Date(),
                publishedAt: node.publishedAt ? new Date(node.publishedAt) : null,
                featuredMedia: node.featuredImage
                  ? {
                      url: node.featuredImage.url,
                      id: node.featuredImage.id || "",
                      alt: node.featuredImage.altText || "",
                    }
                  : null,
                variants: node.variants?.edges?.map(({ node: v }) => ({
                  shopifyVariantId: v.id.replace("gid://shopify/ProductVariant/", ""),
                  sku: v.sku || "",
                  barcode: v.barcode || "",
                  price: v.price ? parseFloat(v.price) : 0,
                  inventoryQuantity: v.inventoryQuantity ?? 0,
                })) || [],
                syncedAt: new Date(),
              },
            },
            upsert: true,
          },
        };
      });

      if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps, { ordered: false });
        totalSynced += bulkOps.length;
        console.log(`✅ Synced batch: ${bulkOps.length} (Total: ${totalSynced})`);
      }

      hasNextPage = json.data.products.pageInfo.hasNextPage;
      cursor = products.length ? products[products.length - 1].cursor : null;

      page++;

      // ✅ Small delay to avoid rate limits
      if (hasNextPage) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

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
  console.error("Stack:", err.stack);
});
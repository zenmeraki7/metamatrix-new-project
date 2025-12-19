import { compileFilter } from "../services/filterCompiler.js";
import { Product } from "../models/index.js";

const PAGE_SIZE = 50;

export async function searchProducts(req, res) {
  const session = res.locals.shopify?.session;

  if (!session?.shop) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const shopId = session.shop;
  const {
    filterDsl,
    limit = PAGE_SIZE,
  } = req.body;

  try {
    // ✅ USE YOUR EXISTING COMPILER
    const compiled = await compileFilter({
      shopId,
      filter: filterDsl,
    });

    // Early impossible filter exit
    if (compiled.productMatch?._id?.$exists === false) {
      return res.json({
        products: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }

    const products = await Product.find(compiled.productMatch)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select(
        "shopifyProductId title handle status vendor productType totalInventory featuredMedia"
      )
      .lean();

    return res.json({
      products,
      pageInfo: {
        hasNextPage: products.length === limit,
        hasPreviousPage: false,
      },
    });
  } catch (err) {
    console.error("Filtered search failed:", err);
    return res.status(500).json({ error: err.message });
  }
}

// web/services/shopify/graphqlClient.js
import fetch from "node-fetch";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const SHOPIFY_API_VERSION = "2024-10";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const BASE_BACKOFF_MS = 250;
const MAX_BACKOFF_MS = 5_000;

/* ------------------------------------------------------------------ */
/* Guards                                                             */
/* ------------------------------------------------------------------ */

function assertWorkerContext(ctx) {
  if (!ctx?.jobId) {
    throw new Error("GraphQL client requires job context");
  }
}

function assertValidShop(shop) {
  if (!shop?.endsWith(".myshopify.com")) {
    throw new Error("Invalid shop domain");
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoff(attempt) {
  const exp = Math.min(
    MAX_BACKOFF_MS,
    BASE_BACKOFF_MS * 2 ** attempt
  );
  return exp + Math.floor(Math.random() * 100);
}

function normalizeError(ctx, type, errors, cost) {
  return {
    jobId: ctx.jobId,
    type, // "THROTTLED" | "GRAPHQL" | "NETWORK"
    errors,
    cost,
  };
}

/* ------------------------------------------------------------------ */
/* GraphQL Executor (Cost-aware, Retry-safe)                           */
/* ------------------------------------------------------------------ */

export async function shopifyGraphQL({
  ctx,
  query,
  variables,
}) {
  assertWorkerContext(ctx);
  assertValidShop(ctx.shop);

  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      10_000
    );

    let response;
    try {
      response = await fetch(
        `https://${ctx.shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            ...JSON_HEADERS,
            "X-Shopify-Access-Token": ctx.accessToken,
            "X-Job-Id": ctx.jobId,
          },
          body: JSON.stringify({ query, variables }),
          signal: controller.signal,
        }
      );
    } catch {
      clearTimeout(timeout);

      if (attempt >= ctx.maxRetries) {
        throw normalizeError(ctx, "NETWORK");
      }

      await sleep(backoff(attempt++));
      continue;
    }

    clearTimeout(timeout);

    const json = await response.json();
    const cost = json.extensions?.cost;

    if (
      response.status === 429 ||
      cost?.throttleStatus?.currentlyAvailable === 0
    ) {
      if (attempt >= ctx.maxRetries) {
        throw normalizeError(
          ctx,
          "THROTTLED",
          json.errors,
          cost
        );
      }

      await sleep(backoff(attempt++));
      continue;
    }

    if (json.errors?.length) {
      throw normalizeError(
        ctx,
        "GRAPHQL",
        json.errors,
        cost
      );
    }

    if (!json.data) {
      throw normalizeError(ctx, "GRAPHQL", undefined, cost);
    }

    return json.data;
  }
}

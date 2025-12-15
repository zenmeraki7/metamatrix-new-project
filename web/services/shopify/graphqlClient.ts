// web/services/shopify/graphqlClient.ts
import fetch, { RequestInit } from "node-fetch";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface ShopifyJobContext {
  jobId: string;
  shop: string;
  accessToken: string;
  maxRetries: number;
}

export interface ShopifyGraphQLParams<TVariables = unknown> {
  ctx: ShopifyJobContext;
  query: string;
  variables?: TVariables;
}

export interface ShopifyGraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
}

export interface ShopifyGraphQLCost {
  requestedQueryCost: number;
  actualQueryCost: number;
  throttleStatus: {
    currentlyAvailable: number;
    restoreRate: number;
  };
}

export interface ShopifyGraphQLResponse<TData> {
  data?: TData;
  errors?: ShopifyGraphQLError[];
  extensions?: {
    cost?: ShopifyGraphQLCost;
  };
}

export interface NormalizedShopifyError {
  jobId: string;
  type: "THROTTLED" | "GRAPHQL" | "NETWORK";
  errors?: ShopifyGraphQLError[];
  cost?: ShopifyGraphQLCost;
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const SHOPIFY_API_VERSION = "2024-10";
const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

const BASE_BACKOFF_MS = 250;
const MAX_BACKOFF_MS = 5_000;

/* ------------------------------------------------------------------ */
/* Guards                                                             */
/* ------------------------------------------------------------------ */

function assertWorkerContext(ctx: ShopifyJobContext): void {
  if (!ctx?.jobId) {
    throw new Error("GraphQL client requires job context");
  }
}

function assertValidShop(shop: string): void {
  if (!shop.endsWith(".myshopify.com")) {
    throw new Error("Invalid shop domain");
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function backoff(attempt: number): number {
  const exp = Math.min(
    MAX_BACKOFF_MS,
    BASE_BACKOFF_MS * 2 ** attempt
  );
  return exp + Math.floor(Math.random() * 100);
}

function normalizeError(
  ctx: ShopifyJobContext,
  type: NormalizedShopifyError["type"],
  errors?: ShopifyGraphQLError[],
  cost?: ShopifyGraphQLCost
): NormalizedShopifyError {
  return {
    jobId: ctx.jobId,
    type,
    errors,
    cost,
  };
}

/* ------------------------------------------------------------------ */
/* GraphQL Executor (Worker-only, Cost-aware, Retry-safe)             */
/* ------------------------------------------------------------------ */

export async function shopifyGraphQL<
  TData,
  TVariables = Record<string, unknown>
>({
  ctx,
  query,
  variables,
}: ShopifyGraphQLParams<TVariables>): Promise<TData> {
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
        } satisfies RequestInit
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

    const json =
      (await response.json()) as ShopifyGraphQLResponse<TData>;

    const cost = json.extensions?.cost;

    if (
      response.status === 429 ||
      cost?.throttleStatus.currentlyAvailable === 0
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

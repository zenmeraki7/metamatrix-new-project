// pages/Products.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Page,
  Card,
  IndexTable,
  Text,
  Badge,
  Thumbnail,
  Pagination,
  Button,
  InlineStack,
  BlockStack,
  TextField,
  Popover,
  Box,
  Divider,
  Spinner,
  Banner,
} from "@shopify/polaris";

import { StatusFilter } from "../components/filters/StatusFilter";
import { VendorFilter } from "../components/filters/VendorFilter";
import { ProductTypeFilter } from "../components/filters/ProductTypeFilter";
import { TagPicker } from "../components/filters/TagPicker";
import { CollectionFilter } from "../components/filters/CollectionFilter";
import { InventoryFilter } from "../components/filters/InventoryFilter";
import { VariantFilter } from "../components/filters/VariantFilter";
import { MetafieldKeyPicker } from "../components/filters/MetafieldKeyPicker";

/* ---------------- types ---------------- */

type ProductRow = {
  shopifyProductId: string;
  title: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  vendor?: string;
  productType?: string;
  totalInventory?: number;
  featuredMedia?: { url?: string; alt?: string };
};

type MetafieldOwner = "PRODUCT" | "VARIANT";

/* ---------------- helpers ---------------- */

function countAppliedFilters(filters: any) {
  let n = 0;
  for (const k of Object.keys(filters)) {
    const v = filters[k];
    if (Array.isArray(v)) n += v.length ? 1 : 0;
    else if (typeof v === "string") n += v.trim() ? 1 : 0;
    else if (v != null) n += 1;
  }
  return n;
}

/* ---------------- defaults ---------------- */

const DEFAULT_FILTERS = {
  status: [] as string[],
  vendor: "",
  productType: "",
  tag: "",
  collectionId: "",
  inventoryMin: "",
  inventoryMax: "",
  variantSku: "",
  variantPriceMin: "",
  variantPriceMax: "",
  mfOwner: "PRODUCT" as MetafieldOwner,
  mfNamespace: "",
  mfKey: "",
  mfType: "single_line_text_field",
  mfOp: "eq" as "eq" | "contains" | "gt" | "lt" | "exists" | "not_exists",
  mfValue: "",
};

export default function ProductsPage() {
  /* ---------------- pagination ---------------- */

  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [cursor, setCursor] = useState<string | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);

  /* ---------------- search ---------------- */

  const [q, setQ] = useState("");
  const qDebounceRef = useRef<number | null>(null);

  /* ---------------- filters ---------------- */

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ ...DEFAULT_FILTERS });
  const [applied, setApplied] = useState({ ...DEFAULT_FILTERS });

  const [openSection, setOpenSection] = useState<Record<string, boolean>>({});

  const appliedCount = useMemo(
    () => countAppliedFilters(applied),
    [applied]
  );

  const toggleSection = (key: string) => {
    setOpenSection((p) => ({ ...p, [key]: !p[key] }));
  };

  /* ---------------- filter DSL ---------------- */

  const filterDsl = useMemo(() => {
    const and: any[] = [];

    if (q.trim()) {
      and.push({
        or: [
          { condition: { field: "product.title", op: "contains", value: q } },
          { condition: { field: "product.handle", op: "contains", value: q } },
        ],
      });
    }

    if (applied.status.length) {
      and.push({
        condition: {
          field: "product.status",
          op: "in",
          value: applied.status,
        },
      });
    }

    if (applied.vendor.trim()) {
      and.push({
        condition: {
          field: "product.vendor",
          op: "contains",
          value: applied.vendor,
        },
      });
    }

    if (applied.productType.trim()) {
      and.push({
        condition: {
          field: "product.productType",
          op: "contains",
          value: applied.productType,
        },
      });
    }

    if (applied.tag.trim()) {
      and.push({
        condition: {
          field: "product.tags",
          op: "contains",
          value: applied.tag,
        },
      });
    }

    const minInv = Number(applied.inventoryMin);
    const maxInv = Number(applied.inventoryMax);

    if (!Number.isNaN(minInv)) {
      and.push({
        condition: {
          field: "product.totalInventory",
          op: "gte",
          value: minInv,
        },
      });
    }

    if (!Number.isNaN(maxInv)) {
      and.push({
        condition: {
          field: "product.totalInventory",
          op: "lte",
          value: maxInv,
        },
      });
    }

    if (applied.variantSku.trim()) {
      and.push({
        condition: {
          field: "variant.sku",
          op: "contains",
          value: applied.variantSku,
        },
      });
    }

    if (applied.mfNamespace && applied.mfKey) {
      const cond: any = {
        field: "metafield",
        op: applied.mfOp,
        meta: {
          owner: applied.mfOwner,
          namespace: applied.mfNamespace,
          key: applied.mfKey,
          type: applied.mfType,
        },
      };

      if (!["exists", "not_exists"].includes(applied.mfOp)) {
        cond.value = applied.mfValue;
      }

      and.push({ condition: cond });
    }

    return and.length ? { and } : null;
  }, [q, applied]);

  /* ---------------- query signature ---------------- */

  const querySignature = useMemo(
    () => JSON.stringify({ q, filter: filterDsl }),
    [q, filterDsl]
  );

  /* 🔥 reset pagination when filters/search change */
  useEffect(() => {
    setCursor(null);
    setDirection("next");
  }, [querySignature]);

  /* ---------------- fetch ---------------- */

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/products/search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 50,
          cursor,
          direction,
          query: q,
          ...(filterDsl ? { filter: filterDsl } : {}),
        }),
      });

      if (!r.ok) throw new Error(await r.text());

      const data = await r.json();

      setItems(
        data.items.map((p: any) => ({
          shopifyProductId: p.id,
          title: p.title,
          status: p.status,
          vendor: p.vendor,
          productType: p.productType,
          totalInventory: p.totalInventory,
          featuredMedia: {
            url: p.image?.url,
            alt: p.image?.altText,
          },
        }))
      );

      setNextCursor(data.pageInfo.nextCursor);
      setPrevCursor(data.pageInfo.prevCursor);
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [cursor, direction, querySignature]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ---------------- handlers ---------------- */

  const onSearchChange = useCallback((val: string) => {
    setQ(val);
    if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(fetchProducts, 300);
  }, [fetchProducts]);

  const applyDraft = () => {
    setApplied(draft);
    setFiltersOpen(false);
  };

  const clearAll = () => {
    setDraft({ ...DEFAULT_FILTERS });
    setApplied({ ...DEFAULT_FILTERS });
    setQ("");
  };

  /* ---------------- UI ---------------- */

  return (
    <Page title="Products">
      <Card>
        <Box padding="300">
          <InlineStack gap="300" align="space-between">
            <TextField
              label="Search"
              labelHidden
              value={q}
              onChange={onSearchChange}
              placeholder="Search products"
            />

            <Popover
              active={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              activator={
                <Button onClick={() => setFiltersOpen((v) => !v)}>
                  Filters{appliedCount ? ` (${appliedCount})` : ""}
                </Button>
              }
            >
              <Box padding="300" width="420px">
                <BlockStack gap="300">
                  <StatusFilter
                    isOpen={!!openSection.status}
                    onToggle={() => toggleSection("status")}
                    selected={draft.status}
                    onChange={(v) => setDraft((p) => ({ ...p, status: v }))}
                  />

                  <Divider />

                  <VendorFilter
                    isOpen={!!openSection.vendor}
                    onToggle={() => toggleSection("vendor")}
                    value={draft.vendor}
                    onChange={(v) => setDraft((p) => ({ ...p, vendor: v }))}
                  />

                  <Divider />

                  <InlineStack align="end" gap="200">
                    <Button onClick={clearAll}>Clear</Button>
                    <Button variant="primary" onClick={applyDraft}>
                      Apply
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Popover>

            {loading && <Spinner size="small" />}
          </InlineStack>
        </Box>

        <Divider />

        {loading ? (
          <Box padding="500">
            <InlineStack align="center">
              <Spinner size="large" />
            </InlineStack>
          </Box>
        ) : (
          <IndexTable
            resourceName={{ singular: "product", plural: "products" }}
            itemCount={items.length}
            headings={[
              { title: "Product" },
              { title: "Status" },
              { title: "Vendor" },
              { title: "Inventory" },
            ]}
          >
            {items.map((p, i) => (
              <IndexTable.Row
                id={p.shopifyProductId}
                key={p.shopifyProductId}
                position={i}
              >
                <IndexTable.Cell>
                  <InlineStack gap="300">
                    <Thumbnail
                      source={p.featuredMedia?.url || ""}
                      alt={p.title}
                    />
                    <Text>{p.title}</Text>
                  </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge tone={p.status === "ACTIVE" ? "success" : "attention"}>
                    {p.status}
                  </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>{p.vendor || "-"}</IndexTable.Cell>
                <IndexTable.Cell>{p.totalInventory ?? "-"}</IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}

        <Box padding="300">
          <InlineStack align="end">
            <Pagination
              hasPrevious={!!prevCursor}
              hasNext={!!nextCursor}
              onPrevious={() => {
                setDirection("prev");
                setCursor(prevCursor);
              }}
              onNext={() => {
                setDirection("next");
                setCursor(nextCursor);
              }}
            />
          </InlineStack>
        </Box>
      </Card>
    </Page>
  );
}

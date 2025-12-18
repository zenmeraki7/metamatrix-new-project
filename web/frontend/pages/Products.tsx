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
  ChoiceList,
  Select,
  Tag,
  Spinner,
} from "@shopify/polaris";

type ProductRow = {
  shopifyProductId: string;
  title: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  vendor?: string;
  productType?: string;
  totalInventory?: number;
  featuredMedia?: { url?: string; alt?: string };
};

type ApiResp = {
  items: ProductRow[];
  pageInfo: {
    nextCursor: string | null;
    prevCursor: string | null;
  };
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

  const appliedCount = useMemo(
    () => countAppliedFilters(applied),
    [applied],
  );

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
        condition: { field: "product.status", op: "in", value: applied.status },
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
        condition: { field: "product.tags", op: "contains", value: applied.tag },
      });
    }

    if (applied.collectionId.trim()) {
      and.push({
        condition: {
          field: "product.collectionIds",
          op: "in",
          value: [applied.collectionId.trim()],
        },
      });
    }

    const invMin = Number(applied.inventoryMin);
    const invMax = Number(applied.inventoryMax);

    if (!Number.isNaN(invMin)) {
      and.push({
        condition: {
          field: "product.totalInventory",
          op: "gte",
          value: invMin,
        },
      });
    }

    if (!Number.isNaN(invMax)) {
      and.push({
        condition: {
          field: "product.totalInventory",
          op: "lte",
          value: invMax,
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

    const pMin = Number(applied.variantPriceMin);
    const pMax = Number(applied.variantPriceMax);

    if (!Number.isNaN(pMin)) {
      and.push({
        condition: { field: "variant.price", op: "gte", value: pMin },
      });
    }

    if (!Number.isNaN(pMax)) {
      and.push({
        condition: { field: "variant.price", op: "lte", value: pMax },
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

      if (
        applied.mfOp !== "exists" &&
        applied.mfOp !== "not_exists"
      ) {
        cond.value = applied.mfValue;
      }

      and.push({ condition: cond });
    }

    return and.length ? { and } : null;
  }, [q, applied]);

  /* ---------------- data fetch ---------------- */

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("mode", "random");
      params.set("direction", direction);
      if (cursor) params.set("cursor", cursor);
      if (filterDsl) params.set("filters", JSON.stringify(filterDsl));

      const r = await fetch(
        `/api/products/products?${params.toString()}`,
        { credentials: "include" },
      );

      if (!r.ok) {
        throw new Error(await r.text());
      }

      const data: ApiResp = await r.json();
      setItems(data.items);
      setNextCursor(data.pageInfo.nextCursor);
      setPrevCursor(data.pageInfo.prevCursor);
    } catch (e) {
      console.error("Fetch products failed", e);
    } finally {
      setLoading(false);
    }
  }, [cursor, direction, filterDsl]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ---------------- handlers ---------------- */

  const onSearchChange = useCallback(
    (val: string) => {
      setQ(val);
      setCursor(null);
      setDirection("next");

      if (qDebounceRef.current) {
        window.clearTimeout(qDebounceRef.current);
      }

      qDebounceRef.current = window.setTimeout(fetchProducts, 250);
    },
    [fetchProducts],
  );

  const clearAll = useCallback(() => {
    setDraft({ ...DEFAULT_FILTERS });
    setApplied({ ...DEFAULT_FILTERS });
    setQ("");
    setCursor(null);
    setDirection("next");
  }, []);

  const applyDraft = useCallback(() => {
    setApplied(draft);
    setCursor(null);
    setDirection("next");
    setFiltersOpen(false);
  }, [draft]);

  /* ---------------- UI ---------------- */

  return (
    <Page title="Products">
      <Card>
        {/* Top bar */}
        <Box padding="300">
          <InlineStack align="space-between" blockAlign="center" gap="300">
            <InlineStack gap="300" blockAlign="center">
              <div style={{ minWidth: 360 }}>
                <TextField
                  label="Search"
                  labelHidden
                  value={q}
                  onChange={onSearchChange}
                  placeholder="Search title or handle"
                  autoComplete="off"
                />
              </div>

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
      <Text as="h3" variant="headingMd">
        Filters
      </Text>

      <Divider />

      <ChoiceList
        title="Status"
        choices={[
          { label: "Active", value: "ACTIVE" },
          { label: "Draft", value: "DRAFT" },
          { label: "Archived", value: "ARCHIVED" },
        ]}
        selected={draft.status}
        onChange={(v) => setDraft((p) => ({ ...p, status: v }))}
        allowMultiple
      />

      <TextField
        label="Vendor contains"
        value={draft.vendor}
        onChange={(v) => setDraft((p) => ({ ...p, vendor: v }))}
        autoComplete="off"
      />

      <TextField
        label="Product type contains"
        value={draft.productType}
        onChange={(v) => setDraft((p) => ({ ...p, productType: v }))}
        autoComplete="off"
      />

      <TextField
        label="Tag contains"
        value={draft.tag}
        onChange={(v) => setDraft((p) => ({ ...p, tag: v }))}
        autoComplete="off"
      />

      <TextField
        label="Collection ID (GID)"
        value={draft.collectionId}
        onChange={(v) =>
          setDraft((p) => ({ ...p, collectionId: v }))
        }
        autoComplete="off"
      />

      <Divider />

      <Text as="h4" variant="headingSm">
        Inventory
      </Text>

      <InlineStack gap="300">
        <TextField
          label="Min"
          value={draft.inventoryMin}
          onChange={(v) =>
            setDraft((p) => ({ ...p, inventoryMin: v }))
          }
          autoComplete="off"
        />
        <TextField
          label="Max"
          value={draft.inventoryMax}
          onChange={(v) =>
            setDraft((p) => ({ ...p, inventoryMax: v }))
          }
          autoComplete="off"
        />
      </InlineStack>

      <Divider />

      <Text as="h4" variant="headingSm">
        Variant
      </Text>

      <TextField
        label="SKU contains"
        value={draft.variantSku}
        onChange={(v) =>
          setDraft((p) => ({ ...p, variantSku: v }))
        }
        autoComplete="off"
      />

      <InlineStack gap="300">
        <TextField
          label="Price min"
          value={draft.variantPriceMin}
          onChange={(v) =>
            setDraft((p) => ({ ...p, variantPriceMin: v }))
          }
          autoComplete="off"
        />
        <TextField
          label="Price max"
          value={draft.variantPriceMax}
          onChange={(v) =>
            setDraft((p) => ({ ...p, variantPriceMax: v }))
          }
          autoComplete="off"
        />
      </InlineStack>

      <Divider />

      <Text as="h4" variant="headingSm">
        Metafield
      </Text>

      <Select
        label="Owner"
        options={[
          { label: "Product", value: "PRODUCT" },
          { label: "Variant", value: "VARIANT" },
        ]}
        value={draft.mfOwner}
        onChange={(v) =>
          setDraft((p) => ({ ...p, mfOwner: v as MetafieldOwner }))
        }
      />

      <InlineStack gap="300">
        <TextField
          label="Namespace"
          value={draft.mfNamespace}
          onChange={(v) =>
            setDraft((p) => ({ ...p, mfNamespace: v }))
          }
          autoComplete="off"
        />
        <TextField
          label="Key"
          value={draft.mfKey}
          onChange={(v) =>
            setDraft((p) => ({ ...p, mfKey: v }))
          }
          autoComplete="off"
        />
      </InlineStack>

      <Select
        label="Type"
        options={[
          { label: "single_line_text_field", value: "single_line_text_field" },
          { label: "multi_line_text_field", value: "multi_line_text_field" },
          { label: "number_integer", value: "number_integer" },
          { label: "number_decimal", value: "number_decimal" },
          { label: "boolean", value: "boolean" },
          { label: "date", value: "date" },
          { label: "date_time", value: "date_time" },
        ]}
        value={draft.mfType}
        onChange={(v) =>
          setDraft((p) => ({ ...p, mfType: v }))
        }
      />

      <Select
        label="Operator"
        options={[
          { label: "equals", value: "eq" },
          { label: "contains", value: "contains" },
          { label: "greater than", value: "gt" },
          { label: "less than", value: "lt" },
          { label: "exists", value: "exists" },
          { label: "not exists", value: "not_exists" },
        ]}
        value={draft.mfOp}
        onChange={(v) =>
          setDraft((p) => ({ ...p, mfOp: v as any }))
        }
      />

      {draft.mfOp !== "exists" &&
        draft.mfOp !== "not_exists" && (
          <TextField
            label="Value"
            value={draft.mfValue}
            onChange={(v) =>
              setDraft((p) => ({ ...p, mfValue: v }))
            }
            autoComplete="off"
          />
        )}

      <Divider />

      <InlineStack align="end" gap="200">
        <Button onClick={() => setDraft(applied)}>Reset</Button>
        <Button destructive onClick={clearAll}>
          Clear all
        </Button>
        <Button variant="primary" onClick={applyDraft}>
          Apply
        </Button>
      </InlineStack>
    </BlockStack>
  </Box>
</Popover>

              <Button
                tone="critical"
                variant="tertiary"
                onClick={clearAll}
              >
                Clear
              </Button>
            </InlineStack>

            {loading && <Spinner size="small" />}
          </InlineStack>
        </Box>

        <Divider />

        {/* Table */}
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
            selectable={false}
            headings={[
              { title: "Product" },
              { title: "Status" },
              { title: "Vendor" },
              { title: "Type" },
              { title: "Inventory" },
            ]}
          >
            {items.map((p, index) => (
              <IndexTable.Row
                id={p.shopifyProductId}
                key={p.shopifyProductId}
                position={index}
              >
                <IndexTable.Cell>
                  <InlineStack gap="300" blockAlign="center">
                    <Thumbnail
                      source={p.featuredMedia?.url || ""}
                      alt={p.featuredMedia?.alt || p.title}
                    />
                    <Text as="span" fontWeight="semibold">
                      {p.title}
                    </Text>
                  </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge
                    tone={
                      p.status === "ACTIVE"
                        ? "success"
                        : p.status === "DRAFT"
                        ? "attention"
                        : undefined
                    }
                  >
                    {p.status}
                  </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>{p.vendor || "-"}</IndexTable.Cell>
                <IndexTable.Cell>{p.productType || "-"}</IndexTable.Cell>
                <IndexTable.Cell>
                  {typeof p.totalInventory === "number"
                    ? p.totalInventory
                    : "-"}
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}

        {/* Pagination */}
        <Box padding="300">
          <InlineStack align="end">
            <Pagination
              hasPrevious={Boolean(prevCursor)}
              hasNext={Boolean(nextCursor)}
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

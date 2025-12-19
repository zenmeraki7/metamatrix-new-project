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
  const [openSection, setOpenSection] = useState<{
    status?: boolean;
    vendor?: boolean;
    productType?: boolean;
    inventory?: boolean;
    variant?: boolean;
    metafield?: boolean;
    tag?: boolean;
    collection?: boolean;
  }>({});

  const appliedCount = useMemo(() => countAppliedFilters(applied), [applied]);

  const toggleSection = (key: keyof typeof openSection) => {
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

      if (applied.mfOp !== "exists" && applied.mfOp !== "not_exists") {
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
      params.set("direction", direction);
      if (cursor) params.set("cursor", cursor);
      if (q.trim()) params.set("query", q); // Shopify search

      const r = await fetch(`/api/products?${params.toString()}`, {
        credentials: "include",
      });

      if (!r.ok) {
        throw new Error(await r.text());
      }

      const data = await r.json();

      // 🔁 map Shopify → UI format
      setItems(
        data.products.map((p: any) => ({
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

      setNextCursor(data.pageInfo.hasNextPage ? data.pageInfo.endCursor : null);
      setPrevCursor(
        data.pageInfo.hasPreviousPage ? data.pageInfo.startCursor : null
      );
    } catch (e) {
      console.error("Fetch products failed", e);
    } finally {
      setLoading(false);
    }
  }, [cursor, direction, q]);

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
    [fetchProducts]
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [matchedCount, setMatchedCount] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
    setAllMatchingSelected(false);
    setMatchedCount(null);
  }, [JSON.stringify(filterDsl)]);

  const toId = (p: ProductRow) => p.shopifyProductId;

  const pageIds = useMemo(() => items.map(toId), [items]);

  const isItemSelected = useCallback(
    (id: string) => {
      if (allMatchingSelected) return !excludedIds.has(id);
      return selectedIds.has(id);
    },
    [allMatchingSelected, excludedIds, selectedIds]
  );

  const selectedItemsCount = useMemo(() => {
    if (allMatchingSelected) return "All";
    return selectedIds.size;
  }, [allMatchingSelected, selectedIds]);

  const selectedForTable = useMemo(() => {
    if (allMatchingSelected)
      return pageIds.filter((id) => !excludedIds.has(id));
    return Array.from(selectedIds).filter((id) => pageIds.includes(id));
  }, [allMatchingSelected, excludedIds, pageIds, selectedIds]);

  const handleSelectionChange = useCallback(
    (selected: string[]) => {
      if (allMatchingSelected) {
        const nextExcluded = new Set(excludedIds);
        for (const id of pageIds) {
          const shouldBeSelected = selected.includes(id);
          const currentlySelected = !nextExcluded.has(id);
          if (shouldBeSelected && !currentlySelected) nextExcluded.delete(id);
          else if (!shouldBeSelected && currentlySelected)
            nextExcluded.add(id);
        }
        setExcludedIds(nextExcluded);
      } else {
        const next = new Set(selectedIds);
        for (const id of pageIds) {
          if (selected.includes(id)) next.add(id);
          else next.delete(id);
        }
        setSelectedIds(next);
      }
    },
    [allMatchingSelected, excludedIds, pageIds, selectedIds]
  );

  const selectPage = useCallback(() => {
    if (allMatchingSelected) {
      const nextExcluded = new Set(excludedIds);
      for (const id of pageIds) nextExcluded.delete(id);
      setExcludedIds(nextExcluded);
      return;
    }
    const next = new Set(selectedIds);
    for (const id of pageIds) next.add(id);
    setSelectedIds(next);
  }, [allMatchingSelected, excludedIds, pageIds, selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
    setAllMatchingSelected(false);
  }, []);

  const selectAllMatching = useCallback(async () => {
    setAllMatchingSelected(true);
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }, []);

  const pageSelectedCount = useMemo(() => {
    if (allMatchingSelected)
      return pageIds.filter((id) => !excludedIds.has(id)).length;
    return pageIds.filter((id) => selectedIds.has(id)).length;
  }, [allMatchingSelected, excludedIds, pageIds, selectedIds]);

  const showBanner = useMemo(() => {
    return (
      allMatchingSelected || selectedIds.size > 0 || excludedIds.size > 0
    );
  }, [allMatchingSelected, selectedIds, excludedIds]);

  const [mfOwner, setMfOwner] = useState<"PRODUCT" | "VARIANT">("PRODUCT");
  const [mfKeySel, setMfKeySel] = useState<{
    namespace: string;
    key: string;
    type: string;
  } | null>(null);

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

                    <ProductTypeFilter
                      isOpen={!!openSection.productType}
                      onToggle={() => toggleSection("productType")}
                      value={draft.productType}
                      onChange={(v) =>
                        setDraft((p) => ({ ...p, productType: v }))
                      }
                    />

                    <Divider />

                    <TagPicker
                      isOpen={!!openSection.tag}
                      onToggle={() => toggleSection("tag")}
                      value={draft.tag}
                      onChange={(tag) => setDraft((p) => ({ ...p, tag }))}
                    />

                    <Divider />

                    <CollectionFilter
                      isOpen={!!openSection.collection}
                      onToggle={() => toggleSection("collection")}
                      value={draft.collectionId}
                      onChange={(v) =>
                        setDraft((p) => ({ ...p, collectionId: v }))
                      }
                    />

                    <Divider />

                    <InventoryFilter
                      isOpen={!!openSection.inventory}
                      onToggle={() => toggleSection("inventory")}
                      min={draft.inventoryMin}
                      max={draft.inventoryMax}
                      onMinChange={(v) =>
                        setDraft((p) => ({ ...p, inventoryMin: v }))
                      }
                      onMaxChange={(v) =>
                        setDraft((p) => ({ ...p, inventoryMax: v }))
                      }
                    />

                    <Divider />

                    <VariantFilter
                      isOpen={!!openSection.variant}
                      onToggle={() => toggleSection("variant")}
                      sku={draft.variantSku}
                      priceMin={draft.variantPriceMin}
                      priceMax={draft.variantPriceMax}
                      onSkuChange={(v) =>
                        setDraft((p) => ({ ...p, variantSku: v }))
                      }
                      onPriceMinChange={(v) =>
                        setDraft((p) => ({ ...p, variantPriceMin: v }))
                      }
                      onPriceMaxChange={(v) =>
                        setDraft((p) => ({ ...p, variantPriceMax: v }))
                      }
                    />

                    <Divider />

                    <MetafieldKeyPicker
                      isOpen={!!openSection.metafield}
                      onToggle={() => toggleSection("metafield")}
                      ownerType={mfOwner}
                      selectedKey={mfKeySel}
                      namespace={draft.mfNamespace}
                      keyValue={draft.mfKey}
                      type={draft.mfType}
                      operator={draft.mfOp}
                      value={draft.mfValue}
                      onKeySelect={(v) => {
                        setMfKeySel(v);
                        setDraft((p) => ({
                          ...p,
                          mfOwner,
                          mfNamespace: v?.namespace || "",
                          mfKey: v?.key || "",
                          mfType: v?.type || "single_line_text_field",
                        }));
                      }}
                      onNamespaceChange={(v) =>
                        setDraft((p) => ({ ...p, mfNamespace: v }))
                      }
                      onKeyChange={(v) =>
                        setDraft((p) => ({ ...p, mfKey: v }))
                      }
                      onTypeChange={(v) =>
                        setDraft((p) => ({ ...p, mfType: v }))
                      }
                      onOperatorChange={(v) =>
                        setDraft((p) => ({ ...p, mfOp: v as any }))
                      }
                      onValueChange={(v) =>
                        setDraft((p) => ({ ...p, mfValue: v }))
                      }
                    />

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

              <Button tone="critical" variant="tertiary" onClick={clearAll}>
                Clear
              </Button>
            </InlineStack>

            {loading && <Spinner size="small" />}
          </InlineStack>
        </Box>

        <Divider />

        {/* Selection controls + banner */}
        {showBanner ? (
          <Box padding="300">
            <Banner
              title={
                allMatchingSelected
                  ? matchedCount != null
                    ? `All ${matchedCount} matching products are selected`
                    : `All matching products are selected`
                  : `${selectedIds.size} product${
                      selectedIds.size === 1 ? "" : "s"
                    } selected`
              }
              tone="info"
              action={{
                content: "Clear selection",
                onAction: clearSelection,
              }}
            >
              <BlockStack gap="200">
                {!allMatchingSelected ? (
                  <InlineStack gap="200">
                    <Text as="span">
                      {pageSelectedCount === pageIds.length
                        ? `All ${pageIds.length} products on this page are selected.`
                        : `Selected ${pageSelectedCount} of ${pageIds.length} on this page.`}
                    </Text>

                    {pageSelectedCount === pageIds.length ? (
                      <Button variant="plain" onClick={selectAllMatching}>
                        {matchedCount != null
                          ? `Select all ${matchedCount} products that match this filter`
                          : "Select all products that match this filter"}
                      </Button>
                    ) : (
                      <Button variant="plain" onClick={selectPage}>
                        Select all on this page
                      </Button>
                    )}
                  </InlineStack>
                ) : (
                  <InlineStack gap="200">
                    <Text as="span">
                      {excludedIds.size
                        ? `${excludedIds.size} excluded from selection.`
                        : "No exclusions."}
                    </Text>
                    <Button variant="plain" onClick={selectPage}>
                      Select all on this page
                    </Button>
                  </InlineStack>
                )}
              </BlockStack>
            </Banner>
          </Box>
        ) : (
          <Box padding="300">
            <InlineStack gap="200" align="end">
              <Button onClick={selectPage} disabled={!items.length}>
                Select page
              </Button>
              <Button onClick={selectAllMatching} disabled={!items.length}>
                Select all matching
              </Button>
            </InlineStack>
          </Box>
        )}

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
            selectable
            selectedItemsCount={selectedItemsCount as any} // Polaris accepts number | "All"
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Product" },
              { title: "Status" },
              { title: "Vendor" },
              { title: "Type" },
              { title: "Inventory" },
            ]}
          >
            {items.map((p, index) => {
              const id = p.shopifyProductId;
              return (
                <IndexTable.Row
                  id={id}
                  key={id}
                  position={index}
                  selected={isItemSelected(id)}
                >
                  <IndexTable.Cell>
                    <InlineStack gap="300" blockAlign="center">
                      <Thumbnail
                        source={p.featuredMedia?.url || ""}
                        alt={p.featuredMedia?.alt || p.title}
                      />
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
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
              );
            })}
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
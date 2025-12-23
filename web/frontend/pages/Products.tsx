// pages/Products.tsx (COMPLETE REFACTORED VERSION)
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
} from "@shopify/polaris";

import { StatusFilter } from "../components/filters/StatusFilter";
import { VendorFilter } from "../components/filters/VendorFilter";
import { ProductTypeFilter } from "../components/filters/ProductTypeFilter";
import { TagPicker } from "../components/filters/TagPicker";
import { CollectionFilter } from "../components/filters/CollectionFilter";
import { InventoryFilter } from "../components/filters/InventoryFilter";
import { MetafieldKeyPicker } from "../components/filters/MetafieldKeyPicker";
import Price from "../components/filters/Price";
import Barcode from "../components/filters/Barcode";
import ProductTitle from "../components/filters/ProductTitle";
import Handle from "../components/filters/Handle";
import Description from "../components/filters/Description";
import SkuFilter from "../components/filters/SkuFilter";
import DateCreated from "../components/filters/DateCreated";
import DateUpdated from "../components/filters/DateUpdated";
import DatePublished from "../components/filters/DatePublished";

import { FiltersState, DEFAULT_FILTERS } from "../components/filters/filterstate/filtersState";
import { buildFilterDsl } from "../components/filters/utils/buildFilterDsl";
import { countAppliedFilters } from "../components/filters/utils/filterCounter";

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
  const [draft, setDraft] = useState<FiltersState>({ ...DEFAULT_FILTERS });
  const [applied, setApplied] = useState<FiltersState>({ ...DEFAULT_FILTERS });
  const [openSection, setOpenSection] = useState<Record<string, boolean>>({});

  const appliedCount = useMemo(() => countAppliedFilters(applied), [applied]);

  const toggleSection = (key: string) => {
    setOpenSection((p) => ({ ...p, [key]: !p[key] }));
  };

  /* ---------------- filter DSL ---------------- */
  const filterDsl = useMemo(() => {
    const baseFilter = buildFilterDsl(applied);

    if (q.trim()) {
      const searchCondition = {
        or: [
          { condition: { field: "product.title", op: "contains", value: q } },
          { condition: { field: "product.handle", op: "contains", value: q } },
        ],
      };

      if (baseFilter) {
        return { and: [searchCondition, ...baseFilter.and] };
      } else {
        return { and: [searchCondition] };
      }
    }

    return baseFilter;
  }, [q, applied]);

  /* ---------------- query signature ---------------- */
  const querySignature = useMemo(
    () => JSON.stringify({ q, filter: filterDsl }),
    [q, filterDsl]
  );

  /* reset pagination when filters/search change */
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
          shopifyProductId: p.shopifyProductId,
          title: p.title,
          status: p.status,
          vendor: p.vendor,
          productType: p.productType,
          totalInventory: p.totalInventory,
          featuredMedia: {
            url: p.featuredMedia?.url,
            alt: p.featuredMedia?.alt,
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
  }, [cursor, direction, q, filterDsl]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ---------------- handlers ---------------- */
  const onSearchChange = useCallback((val: string) => {
    setQ(val);
    if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => {
      setCursor(null);
      setDirection("next");
    }, 300);
  }, []);

  const applyDraft = () => {
    setApplied({ ...draft });
    setFiltersOpen(false);
  };

  const clearAll = () => {
    const reset = { ...DEFAULT_FILTERS };
    setDraft(reset);
    setApplied(reset);
    setQ("");
  };

  /* ---------------- UI ---------------- */
  return (
    <Page title="Products">
      <BlockStack gap="500">
        {/* Top Bar - Search & Filters */}
        <Card>
          <Box padding="300">
            <InlineStack gap="300" align="space-between">
              <div style={{ flex: 1, maxWidth: "400px" }}>
                <TextField
                  label="Search"
                  labelHidden
                  value={q}
                  onChange={onSearchChange}
                  placeholder="Search products by title or handle"
                  autoComplete="off"
                />
              </div>

              <InlineStack gap="200" align="end">
                {appliedCount > 0 && (
                <Button tone="critical" onClick={clearAll}>
              Clear filters
            </Button>
                )}

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
                      {/* Status Filter */}
                      <StatusFilter
                        isOpen={!!openSection.status}
                        onToggle={() => toggleSection("status")}
                        selected={draft.status}
                        onChange={(v) => setDraft((p) => ({ ...p, status: v }))}
                      />
                      <Divider />

                      {/* Product Title */}
                      <ProductTitle
                        isOpen={!!openSection.title}
                        onToggle={() => toggleSection("title")}
                        operator={draft.title.op}
                        value={draft.title.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            title: { ...p.title, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            title: { ...p.title, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Handle */}
                      <Handle
                        isOpen={!!openSection.handle}
                        onToggle={() => toggleSection("handle")}
                        operator={draft.handle.op}
                        value={draft.handle.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            handle: { ...p.handle, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            handle: { ...p.handle, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Description */}
                      <Description
                        isOpen={!!openSection.description}
                        onToggle={() => toggleSection("description")}
                        operator={draft.description.op}
                        value={draft.description.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            description: { ...p.description, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            description: { ...p.description, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Vendor */}
                      <VendorFilter
                        isOpen={!!openSection.vendor}
                        onToggle={() => toggleSection("vendor")}
                        operator={draft.vendor.op}
                        value={draft.vendor.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            vendor: { ...p.vendor, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            vendor: { ...p.vendor, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Product Type */}
                      <ProductTypeFilter
                        isOpen={!!openSection.productType}
                        onToggle={() => toggleSection("productType")}
                        operator={draft.productType.op}
                        value={draft.productType.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            productType: { ...p.productType, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            productType: { ...p.productType, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Tag */}
                      <TagPicker
                        isOpen={!!openSection.tag}
                        onToggle={() => toggleSection("tag")}
                        operator={draft.tag.op}
                        value={draft.tag.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            tag: { ...p.tag, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            tag: { ...p.tag, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Collection */}
                      <CollectionFilter
                        isOpen={!!openSection.collection}
                        onToggle={() => toggleSection("collection")}
                        operator={draft.collection.op}
                        value={draft.collection.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            collection: { ...p.collection, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            collection: { ...p.collection, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Inventory */}
                      <InventoryFilter
                        isOpen={!!openSection.inventory}
                        onToggle={() => toggleSection("inventory")}
                        min={draft.inventory.min}
                        max={draft.inventory.max}
                        onMinChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            inventory: { ...p.inventory, min: v },
                          }))
                        }
                        onMaxChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            inventory: { ...p.inventory, max: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* SKU */}
                      <SkuFilter
                        isOpen={!!openSection.sku}
                        onToggle={() => toggleSection("sku")}
                        operator={draft.sku.op}
                        value={draft.sku.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            sku: { ...p.sku, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            sku: { ...p.sku, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Price */}
                      <Price
                        isOpen={!!openSection.price}
                        onToggle={() => toggleSection("price")}
                        operator={draft.price.op}
                        value={draft.price.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            price: { ...p.price, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            price: { ...p.price, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Barcode */}
                      <Barcode
                        isOpen={!!openSection.barcode}
                        onToggle={() => toggleSection("barcode")}
                        operator={draft.barcode.op}
                        value={draft.barcode.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            barcode: { ...p.barcode, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            barcode: { ...p.barcode, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Date Created */}
                      <DateCreated
                        isOpen={!!openSection.dateCreated}
                        onToggle={() => toggleSection("dateCreated")}
                        operator={draft.dateCreated.op}
                        value={draft.dateCreated.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dateCreated: { ...p.dateCreated, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dateCreated: { ...p.dateCreated, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Date Updated */}
                      <DateUpdated
                        isOpen={!!openSection.dateUpdated}
                        onToggle={() => toggleSection("dateUpdated")}
                        operator={draft.dateUpdated.op}
                        value={draft.dateUpdated.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dateUpdated: { ...p.dateUpdated, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dateUpdated: { ...p.dateUpdated, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Date Published */}
                      <DatePublished
                        isOpen={!!openSection.datePublished}
                        onToggle={() => toggleSection("datePublished")}
                        operator={draft.datePublished.op}
                        value={draft.datePublished.value}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            datePublished: { ...p.datePublished, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            datePublished: { ...p.datePublished, value: v },
                          }))
                        }
                      />
                      <Divider />

                      {/* Metafield Filter */}
                      <MetafieldKeyPicker
                        isOpen={!!openSection.metafield}
                        onToggle={() => toggleSection("metafield")}
                        owner={draft.metafield.owner}
                        namespace={draft.metafield.namespace}
                        mfKey={draft.metafield.key}
                        type={draft.metafield.type}
                        operator={draft.metafield.op}
                        value={draft.metafield.value}
                        onOwnerChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            metafield: { ...p.metafield, owner: v },
                          }))
                        }
                        onNamespaceChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            metafield: { ...p.metafield, namespace: v },
                          }))
                        }
                        onKeyChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            metafield: { ...p.metafield, key: v },
                          }))
                        }
                        onTypeChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            metafield: { ...p.metafield, type: v },
                          }))
                        }
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            metafield: { ...p.metafield, op: v },
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            metafield: { ...p.metafield, value: v },
                          }))
                        }
                      />

                      <Divider />

                      {/* Action Buttons */}
                      <InlineStack align="end" gap="200">
                        <Button onClick={clearAll}>Clear All</Button>
                        <Button variant="primary" onClick={applyDraft}>
                          Apply Filters
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </Popover>

                {loading && <Spinner size="small" />}
              </InlineStack>
            </InlineStack>
          </Box>
        </Card>

        {/* Product List */}
        <Card padding="0">
          {loading && items.length === 0 ? (
            <Box padding="500">
              <InlineStack align="center">
                <Spinner size="large" />
              </InlineStack>
            </Box>
          ) : items.length > 0 ? (
            <IndexTable
              resourceName={{ singular: "product", plural: "products" }}
              itemCount={items.length}
              headings={[
                { title: "Product" },
                { title: "Status" },
                { title: "Vendor" },
                { title: "Type" },
                { title: "Inventory" },
              ]}
              selectable={false}
            >
              {items.map((p, i) => (
                <IndexTable.Row
                  id={p.shopifyProductId}
                  key={p.shopifyProductId}
                  position={i}
                >
                  <IndexTable.Cell>
                    <InlineStack gap="300" blockAlign="center">
                      <Thumbnail
                        source={p.featuredMedia?.url || ""}
                        alt={p.featuredMedia?.alt || p.title}
                        size="small"
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
                          ? "info"
                          : "warning"
                      }
                    >
                      {p.status}
                    </Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd">
                      {p.vendor || "-"}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd">
                      {p.productType || "-"}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd">
                      {p.totalInventory ?? "-"}
                    </Text>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          ) : (
            <Box padding="500">
              <InlineStack align="center">
                <Text as="p" variant="bodyMd" tone="subdued">
                  No products found
                </Text>
              </InlineStack>
            </Box>
          )}
        </Card>

        {/* Pagination */}
        <Card>
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
      </BlockStack>
    </Page>
  );
}
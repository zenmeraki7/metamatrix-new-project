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
import Price from "../components/filters/Price";
import Barcode from "../components/filters/Barcode";
import ProductTitle from "../components/filters/ProductTitle";
import Handle from "../components/filters/Handle";
import Description from "../components/filters/Description";
import SkuFilter from "../components/filters/SkuFilter";
import DateFilter, { DateOperator } from "../components/filters/DateFilter";
import DatePublished from "../components/filters/DatePublished";
import DateUpdated from "../components/filters/DateUpdated";
import DateCreated from "../components/filters/DateCreated";

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

  dateCreatedOperator: "is_after" as DateOperator,
  dateCreatedValue: "",
  dateCreatedDays: "",

  dateUpdatedOperator: "is_after" as DateOperator,
  dateUpdatedValue: "",
  dateUpdatedDays: "",

  datePublishedOperator: "is_after" as DateOperator,
  datePublishedValue: "",
  datePublishedDays: "",
  /* product title */
  productTitleOperator: "contains",
  productTitleValue: "",

  /* handle */
  handleOperator: "contains",
  handleValue: "",

  /* description */
  descriptionOperator: "contains",
  descriptionValue: "",

  /* product type */
  productTypeOp: "contains",
  productTypeValue: "",

  /* collection */
  collectionOp: "is",
  collectionValue: "",

  /* price */
  priceOperator: "eq",
  priceValue: "",

  /* barcode */
  barcodeOp: "contains",
  barcodeValue: "",

  skuOperator: "contains",
  skuValue: "",

  /* metafields */
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

  const appliedCount = useMemo(() => countAppliedFilters(applied), [applied]);

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
  }, [cursor, direction, querySignature]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ---------------- handlers ---------------- */

  const onSearchChange = useCallback((val: string) => {
    setQ(val);
    if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => {
      // Reset to first page on search
      setCursor(null);
      setDirection("next");
    }, 300);
  }, []);

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
  {/* Filters button */}
   {/* Clear Filters Button */}
  {appliedCount > 0 && (
    <Button tone="critical" onClick={clearAll}>
      Clear filters
    </Button>
  )}

  {/* Filters button */}
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

                      <ProductTitle
                        isOpen={!!openSection.productTitle}
                        onToggle={() => toggleSection("productTitle")}
                        operator={draft.productTitleOperator}
                        value={draft.productTitleValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({ ...p, productTitleOperator: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, productTitleValue: v }))
                        }
                      />
                      <Divider />
                      <DateCreated
                        isOpen={!!openSection.dateCreated}
                        onToggle={() => toggleSection("dateCreated")}
                        operator={draft.dateCreatedOperator}
                        value={draft.dateCreatedValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({ ...p, dateCreatedOperator: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, dateCreatedValue: v }))
                        }
                      />
                      <Divider />
                      <DateUpdated
                        isOpen={!!openSection.dateUpdated}
                        onToggle={() => toggleSection("dateUpdated")}
                        operator={draft.dateUpdatedOperator}
                        value={draft.dateUpdatedValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({ ...p, dateUpdatedOperator: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, dateUpdatedValue: v }))
                        }
                      />
                      <Divider />
                      <DatePublished
                        isOpen={!!openSection.datePublished}
                        onToggle={() => toggleSection("datePublished")}
                        operator={draft.datePublishedOperator}
                        value={draft.datePublishedValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({ ...p, datePublishedOperator: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, datePublishedValue: v }))
                        }
                      />
                      <Divider />
                      <Handle
                        isOpen={!!openSection.handle}
                        onToggle={() => toggleSection("handle")}
                        operator={draft.handleOperator}
                        value={draft.handleValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({ ...p, handleOperator: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, handleValue: v }))
                        }
                      />
                      <Divider />

                      <Description
                        isOpen={!!openSection.description}
                        onToggle={() => toggleSection("description")}
                        operator={draft.descriptionOperator}
                        value={draft.descriptionValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({ ...p, descriptionOperator: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, descriptionValue: v }))
                        }
                      />
                      <Divider />

                      {/* Vendor Filter */}
                      <VendorFilter
                        isOpen={!!openSection.vendor}
                        onToggle={() => toggleSection("vendor")}
                        value={draft.vendor}
                        onChange={(v) => setDraft((p) => ({ ...p, vendor: v }))}
                      />

                      <Divider />

                      {/* Product Type Filter */}
                      <ProductTypeFilter
                        isOpen={!!openSection.productType}
                        onToggle={() => toggleSection("productType")}
                        operator={draft.productTypeOp}
                        value={draft.productTypeValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            productTypeOp: v,
                            productTypeValue: "",
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, productTypeValue: v }))
                        }
                      />

                      <Divider />

                      {/* Tag Filter */}
                      <TagPicker
                        isOpen={!!openSection.tag}
                        onToggle={() => toggleSection("tag")}
                        value={draft.tag}
                        onChange={(v) => setDraft((p) => ({ ...p, tag: v }))}
                      />

                      <Divider />

                      {/* Collection Filter */}
                      <CollectionFilter
                        isOpen={!!openSection.collection}
                        onToggle={() => toggleSection("collection")}
                        operator={draft.collectionOp}
                        value={draft.collectionValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            collectionOp: v,
                            collectionValue: "",
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, collectionValue: v }))
                        }
                      />

                      <Divider />

                      {/* Inventory Filter */}
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

                      {/* Variant Filter */}
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

                      <Price
                        isOpen={!!openSection.price}
                        onToggle={() => toggleSection("price")}
                        operator={draft.priceOperator}
                        value={draft.priceValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({ ...p, priceOperator: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, priceValue: v }))
                        }
                      />

                      <Divider />
                      <SkuFilter
                        isOpen={openSection.sku}
                        onToggle={() => toggleSection("sku")}
                        operator={draft.skuOperator}
                        value={draft.skuValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({ ...p, skuOperator: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, skuValue: v }))
                        }
                      />

                      <Divider />
                      <Barcode
                        isOpen={!!openSection.barcode}
                        onToggle={() => toggleSection("barcode")}
                        operator={draft.barcodeOp}
                        value={draft.barcodeValue}
                        onOperatorChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            barcodeOp: v,
                            barcodeValue: "",
                          }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, barcodeValue: v }))
                        }
                      />

                      <Divider />

                      {/* Metafield Filter */}
                      <MetafieldKeyPicker
                        isOpen={!!openSection.metafield}
                        onToggle={() => toggleSection("metafield")}
                        owner={draft.mfOwner}
                        namespace={draft.mfNamespace}
                        mfKey={draft.mfKey}
                        type={draft.mfType}
                        operator={draft.mfOp}
                        value={draft.mfValue}
                        onOwnerChange={(v) =>
                          setDraft((p) => ({ ...p, mfOwner: v }))
                        }
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
                          setDraft((p) => ({ ...p, mfOp: v }))
                        }
                        onValueChange={(v) =>
                          setDraft((p) => ({ ...p, mfValue: v }))
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

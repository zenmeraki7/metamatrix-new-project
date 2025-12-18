// components/MetafieldKeyPicker.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Select } from "@shopify/polaris";

type OwnerType = "PRODUCT" | "VARIANT" | "COLLECTION";

type Item = {
  namespace: string;
  key: string;
  type: string;
  label: string;
  count?: number;
};

type Resp = {
  items: Item[];
  pageInfo: { nextCursor: string | null; hasNext: boolean };
};

export function MetafieldKeyPicker({
  ownerType,
  value,
  onChange,
  label = "Metafield key",
  placeholder = "Search namespace or key",
  disabled,
  typeFilter, // optional: constrain to a type
}: {
  ownerType: OwnerType;
  value: { namespace: string; key: string; type: string } | null;
  onChange: (v: { namespace: string; key: string; type: string } | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  typeFilter?: string | null;
}) {
  const [inputValue, setInputValue] = useState(value ? `${value.namespace}.${value.key}` : "");
  const [options, setOptions] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const latestQueryRef = useRef<string>("");

  const fetchKeys = useCallback(
    async ({ q, cursor }: { q: string; cursor?: string | null }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("ownerType", ownerType);
        params.set("q", q);
        params.set("limit", "20");
        if (typeFilter) params.set("type", typeFilter);
        if (cursor) params.set("cursor", cursor);

        const r = await fetch(`/api/metafields/keys/search?${params.toString()}`);
        const data: Resp = await r.json();

        setOptions((prev) => (cursor ? [...prev, ...data.items] : data.items));
        setNextCursor(data.pageInfo.nextCursor);
        setHasNext(Boolean(data.pageInfo.hasNext && data.pageInfo.nextCursor));
      } finally {
        setLoading(false);
      }
    },
    [ownerType, typeFilter]
  );

  useEffect(() => {
    if (disabled) return;
    fetchKeys({ q: "", cursor: null });
  }, [disabled, fetchKeys]);

  const onInputChange = useCallback(
    (val: string) => {
      setInputValue(val);
      latestQueryRef.current = val;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        fetchKeys({ q: val.trim().toLowerCase(), cursor: null });
      }, 200);
    },
    [fetchKeys]
  );

  const loadMore = useCallback(() => {
    if (!hasNext || loading) return;
    fetchKeys({ q: latestQueryRef.current.trim().toLowerCase(), cursor: nextCursor });
  }, [fetchKeys, hasNext, loading, nextCursor]);

  // Polaris Autocomplete requires string values; encode triple as one string
  const polarisOptions = useMemo(
    () =>
      options.map((o) => ({
        value: `${o.namespace}|||${o.key}|||${o.type}`,
        label: o.label,
      })),
    [options]
  );

  const selectedValue = value ? [`${value.namespace}|||${value.key}|||${value.type}`] : [];

  const textField = (
    <Autocomplete.TextField
      label={label}
      value={inputValue}
      onChange={onInputChange}
      placeholder={placeholder}
      autoComplete="off"
      disabled={disabled}
    />
  );

  return (
    <Autocomplete
      options={polarisOptions}
      selected={selectedValue}
      onSelect={(selected) => {
        const v = selected?.[0];
        if (!v) {
          onChange(null);
          return;
        }
        const [namespace, key, type] = v.split("|||");
        onChange({ namespace, key, type });
        setInputValue(`${namespace}.${key}`);
      }}
      textField={textField}
      loading={loading}
      willLoadMoreResults={hasNext}
      onLoadMoreResults={loadMore}
      emptyState={inputValue.trim() ? `No metafield keys found for "${inputValue.trim()}".` : "No metafield keys found."}
    />
  );
}

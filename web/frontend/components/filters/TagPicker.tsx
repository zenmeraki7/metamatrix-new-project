// components/TagPicker.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete } from "@shopify/polaris";

type TagOption = { value: string; label: string; count?: number };

type SearchResp = {
  items: TagOption[];
  pageInfo: { nextCursor: string | null; hasNext: boolean };
};

export function TagPicker({
  value,
  onChange,
  label = "Tag",
  placeholder = "Search tags",
  disabled,
  helpText,
}: {
  value: string; // selected tag string
  onChange: (tag: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  helpText?: string;
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [options, setOptions] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const latestQueryRef = useRef<string>("");

  const fetchTags = useCallback(async ({ q, cursor }: { q: string; cursor?: string | null }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("limit", "20");
      if (cursor) params.set("cursor", cursor);

      const r = await fetch(`/api/tags/search?${params.toString()}`);
      const data: SearchResp = await r.json();

      setOptions((prev) => (cursor ? [...prev, ...data.items] : data.items));
      setNextCursor(data.pageInfo.nextCursor);
      setHasNext(Boolean(data.pageInfo.hasNext && data.pageInfo.nextCursor));
    } finally {
      setLoading(false);
    }
  }, []);

  const onInputChange = useCallback(
    (val: string) => {
      setInputValue(val);
      latestQueryRef.current = val;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        fetchTags({ q: val.trim().toLowerCase(), cursor: null });
      }, 200);
    },
    [fetchTags]
  );

  useEffect(() => {
    if (disabled) return;
    fetchTags({ q: "", cursor: null });
  }, [disabled, fetchTags]);

  const loadMore = useCallback(() => {
    if (!hasNext || loading) return;
    fetchTags({ q: latestQueryRef.current.trim().toLowerCase(), cursor: nextCursor });
  }, [fetchTags, hasNext, loading, nextCursor]);

  const polarisOptions = useMemo(
    () => options.map((o) => ({ value: o.value, label: o.label })),
    [options]
  );

  const textField = (
    <Autocomplete.TextField
      label={label}
      value={inputValue}
      onChange={onInputChange}
      placeholder={placeholder}
      helpText={helpText}
      autoComplete="off"
      disabled={disabled}
    />
  );

  return (
    <Autocomplete
      options={polarisOptions}
      selected={value ? [value] : []}
      onSelect={(selected) => {
        const v = selected?.[0] || "";
        onChange(v);
        setInputValue(v);
      }}
      textField={textField}
      loading={loading}
      willLoadMoreResults={hasNext}
      onLoadMoreResults={loadMore}
      emptyState={inputValue.trim() ? `No tags found for "${inputValue.trim()}".` : "No tags found."}
    />
  );
}

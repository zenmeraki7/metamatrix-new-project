// filters/useFilterState.ts
import { useMemo, useState } from "react";
import { FilterDSL } from "./types";
import { DEFAULT_FILTER_DSL } from "./default";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function countNodes(dsl: FilterDSL): number {
  if ("and" in dsl) {
    return dsl.and.reduce(
      (sum, n) =>
        sum +
        ("condition" in n ? 1 : countNodes(n)),
      0
    );
  }
  if ("or" in dsl) {
    return dsl.or.reduce(
      (sum, n) =>
        sum +
        ("condition" in n ? 1 : countNodes(n)),
      0
    );
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export function useFilterState() {
  const [draft, setDraft] = useState<FilterDSL>(DEFAULT_FILTER_DSL);
  const [applied, setApplied] = useState<FilterDSL>(DEFAULT_FILTER_DSL);

  /* ---------------- derived ---------------- */

  const appliedCount = useMemo(
    () => countNodes(applied),
    [applied]
  );

  const hasFilters = appliedCount > 0;

  /* ---------------- actions ---------------- */

  const applyDraft = () => {
    setApplied(draft);
  };

  const clearAll = () => {
    setDraft(DEFAULT_FILTER_DSL);
    setApplied(DEFAULT_FILTER_DSL);
  };

  /* ---------------- exposed ---------------- */

  return {
    // state
    draft,
    applied,

    // setters
    setDraft,

    // actions
    applyDraft,
    clearAll,

    // derived
    appliedCount,
    hasFilters,

    // canonical name used by Products.tsx
    dsl: applied,
  };
}

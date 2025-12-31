// filters/FilterContext.tsx
import React, { createContext, useContext } from "react";
import { useFilterState } from "../../filters/useFilterState";

const FilterContext = createContext<ReturnType<typeof useFilterState> | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const filterState = useFilterState();
  return <FilterContext.Provider value={filterState}>{children}</FilterContext.Provider>;
};

// Custom hook for consuming the context
export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used within a FilterProvider");
  return context;
}

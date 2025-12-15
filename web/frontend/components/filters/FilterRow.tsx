// web/frontend/src/components/filters/FilterRow.tsx
import { memo, useMemo, useCallback } from "react";
import {
  Stack,
  Select,
  Button,
} from "@shopify/polaris";
// import { DeleteIcon } from "@shopify/polaris-icons";

import {
  buildFilterRegistry,
} from "../../config/filterRegistry";
import type {
  FilterFieldDef,
  SubFieldDef,
} from "../../config/filterFields";
import type {
  FilterRule,
} from "../../types/filters";
// import { FilterValueInput } from "./FilterValueInput";

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

interface FilterRowProps {
  rule: FilterRule;
  locations: { id: string; name: string }[];
  executionPhase: "search" | "post_selection";
  onChange: (rule: FilterRule) => void;
  onRemove: () => void;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export const FilterRow = memo(
  function FilterRow({
    rule,
    locations,
    executionPhase,
    onChange,
    onRemove,
  }: FilterRowProps): JSX.Element {
    /* -------------------------------------------------------------- */
    /* Registry (execution-aware)                                     */
    /* -------------------------------------------------------------- */

    const registry = useMemo(
      () => buildFilterRegistry(locations),
      [locations]
    );

    const availableFields = useMemo(
      () =>
        Object.values(registry)
          .filter(
            r => r.executionPhase === executionPhase
          )
          .flatMap(r => r.fields),
      [registry, executionPhase]
    );

    const fieldDef: FilterFieldDef | undefined =
      useMemo(
        () =>
          availableFields.find(
            f => f.key === rule.field
          ),
        [availableFields, rule.field]
      );

    const subFieldDef: SubFieldDef | undefined =
      useMemo(
        () =>
          fieldDef?.subFields?.find(
            sf => sf.key === rule.subField
          ),
        [fieldDef, rule.subField]
      );

    const operators =
      subFieldDef?.operators ??
      fieldDef?.operators ??
      [];

    const valueType =
      subFieldDef?.valueType ??
      fieldDef?.valueType;

    /* -------------------------------------------------------------- */
    /* Handlers                                                       */
    /* -------------------------------------------------------------- */

    const handleFieldChange = useCallback(
      (field: string) => {
        onChange({
          id: rule.id,
          field,
          operator:
            registry.product.fields.find(
              f => f.key === field
            )?.operators[0] ?? "equals",
          value: null,
        });
      },
      [onChange, rule.id, registry]
    );

    const handleSubFieldChange = useCallback(
      (subField: string) => {
        onChange({
          ...rule,
          subField,
          operator:
            fieldDef?.subFields
              ?.find(sf => sf.key === subField)
              ?.operators?.[0] ??
            rule.operator,
          value: null,
        });
      },
      [onChange, rule, fieldDef]
    );

    const handleOperatorChange = useCallback(
      (operator: string) => {
        onChange({
          ...rule,
          operator: operator as any,
          value: null,
        });
      },
      [onChange, rule]
    );

    const handleValueChange = useCallback(
      (value: FilterRule["value"]) => {
        onChange({
          ...rule,
          value,
        });
      },
      [onChange, rule]
    );

    /* -------------------------------------------------------------- */
    /* Render                                                         */
    /* -------------------------------------------------------------- */

    return (
      <Stack gap="400" align="center">
        {/* Field */}
        <Select
          options={availableFields.map(f => ({
            label: f.label,
            value: f.key,
          }))}
          value={rule.field}
          onChange={handleFieldChange}
        />

        {/* Sub-field */}
        {fieldDef?.subFields && (
          <Select
            options={fieldDef.subFields.map(
              sf => ({
                label: sf.label,
                value: sf.key,
              })
            )}
            value={rule.subField}
            onChange={handleSubFieldChange}
          />
        )}

        {/* Operator */}
        {operators.length > 0 && (
          <Select
            options={operators.map(op => ({
              label: op.replace("_", " "),
              value: op,
            }))}
            value={rule.operator}
            onChange={handleOperatorChange}
          />
        )}

        {/* Value */}
        {/* {fieldDef &&
          rule.operator &&
          valueType && (
            <FilterValueInput
              field={fieldDef}
              subField={subFieldDef}
              value={rule.value}
              onChange={handleValueChange}
            />
          )} */}

        {/* Remove */}
        <Button
        //   icon={DeleteIcon}
          tone="critical"
          onClick={onRemove}
        />
      </Stack>a
    );
  }
);

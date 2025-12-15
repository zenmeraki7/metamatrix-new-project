// web/frontend/src/components/filters/FiltersModal.tsx
import {
  Modal,
  Button,
  Stack,
} from "@shopify/polaris";
import {
  memo,
  useState,
  useCallback,
  useMemo,
} from "react";
import { nanoid } from "nanoid";

// import { FilterRow } from "./FilterRow";
import {
  buildFilterRegistry,
} from "../../config/filterRegistry";
import type {
  FilterRule,
} from "../../types/filters";
import type {
  FilterFieldDef,
} from "../../config/filterFields";

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

interface FiltersModalProps {
  open: boolean;
  executionPhase: "search" | "post_selection";
  locations?: { id: string; name: string }[];
  onClose: () => void;
  onApply: (rules: FilterRule[]) => void;
}


/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function createRuleFromField(
  field: FilterFieldDef
): FilterRule {
  return {
    id: nanoid(),
    field: field.key,
    operator: field.operators[0],
    value: null,
  };
}

function isRuleComplete(rule: FilterRule): boolean {
  if (!rule.field) return false;
  if (!rule.operator) return false;
  return rule.value !== null;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export const FiltersModal = memo(
  function FiltersModal({
    open,
    executionPhase,
    locations,
    onClose,
    onApply,
  }: FiltersModalProps): JSX.Element {
    /* -------------------------------------------------------------- */
    /* Registry (authoritative)                                       */
    /* -------------------------------------------------------------- */

    const registry = useMemo(
  () => buildFilterRegistry(locations ?? []),
  [locations]
);


    const allowedFields = useMemo(
      () =>
        Object.values(registry)
          .filter(
            r => r.executionPhase === executionPhase
          )
          .flatMap(r => r.fields),
      [registry, executionPhase]
    );

    /* -------------------------------------------------------------- */
    /* Draft Rules (UI-only)                                          */
    /* -------------------------------------------------------------- */

    const [draftRules, setDraftRules] =
      useState<FilterRule[]>([]);

    /* -------------------------------------------------------------- */
    /* Handlers                                                       */
    /* -------------------------------------------------------------- */

    const addRule = useCallback(() => {
      if (allowedFields.length === 0) return;
      setDraftRules(prev => [
        ...prev,
        createRuleFromField(allowedFields[0]),
      ]);
    }, [allowedFields]);

    const updateRule = useCallback(
      (updated: FilterRule) => {
        setDraftRules(prev =>
          prev.map(r =>
            r.id === updated.id
              ? updated
              : r
          )
        );
      },
      []
    );

    const removeRule = useCallback(
      (id: string) => {
        setDraftRules(prev =>
          prev.filter(r => r.id !== id)
        );
      },
      []
    );

    const handleApply = useCallback(() => {
      const validRules = draftRules.filter(
        isRuleComplete
      );

      if (validRules.length === 0) {
        onApply([]);
        return;
      }

      onApply(validRules);
    }, [draftRules, onApply]);

    /* -------------------------------------------------------------- */
    /* Render                                                         */
    /* -------------------------------------------------------------- */

    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Filter products"
        primaryAction={{
          content: "Apply filters",
          onAction: handleApply,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: onClose,
          },
        ]}
      >
        <Modal.Section>
          <Stack gap="400">
            {/* {draftRules.map(rule => (
              <FilterRow
                key={rule.id}
                rule={rule}
                executionPhase={executionPhase}
                locations={locations}
                onChange={updateRule}
                onRemove={() =>
                  removeRule(rule.id)
                }
              />
            ))} */}

            <Stack>
              <Button onClick={addRule}>
                Add filter
              </Button>
            </Stack>
          </Stack>
        </Modal.Section>
      </Modal>
    );
  }
);

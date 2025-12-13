// import {
//   Modal,
//   Box,
//   Text,
//   Button,
//   Divider,
//   Scrollable,
// } from "@shopify/polaris";
// import React from "react";

// import { FILTER_FIELDS } from "../../config/filterFields";
// import { useFilterStore } from "../../state/filterStore";

// type RulePosition = {
//   groupIndex: number;
//   ruleIndex: number;
// };

// type FieldType = "string" | "number" | "date" | "boolean";

// export default function FieldPickerModal(): JSX.Element | null {
//   const open = useFilterStore((s) => s.fieldPickerOpen);
//   const close = useFilterStore((s) => s.closeFieldPicker);
//   const rulePos = useFilterStore((s) => s.fieldPickerRule) as RulePosition | null;
//   const updateRule = useFilterStore((s) => s.updateRule);
//   const rebuildAST = useFilterStore((s) => s.rebuildAST);

//   if (!open || !rulePos) return null;

//   const selectField = (
//     label: string,
//     _fieldScope: "product" | "variant" | "inventory",
//     path: string,
//     type: FieldType
//   ): void => {
//     updateRule(rulePos.groupIndex, rulePos.ruleIndex, {
//       field: path,
//       fieldLabel: label,
//       fieldType: "standard",
//       operator: getDefaultOperator(type),
//     });

//     rebuildAST();
//     close();
//   };

//   const selectMetafield = (): void => {
//     updateRule(rulePos.groupIndex, rulePos.ruleIndex, {
//       fieldType: "metafield",
//       fieldLabel: "Metafield",
//     });

//     rebuildAST();
//     close();
//   };

//   return (
//     <Modal open={open} onClose={close} title="Select a Field" large>
//       <Modal.Section>
//         <Scrollable style={{ height: "60vh" }}>
//           {/* PRODUCT FIELDS */}
//           <Section title="Product Fields">
//             {Object.entries(FILTER_FIELDS.product).map(([key, cfg]) => (
//               <FieldItem
//                 key={key}
//                 label={cfg.label}
//                 onClick={() =>
//                   selectField(
//                     cfg.label,
//                     "product",
//                     `product.${key}`,
//                     cfg.type as FieldType
//                   )
//                 }
//               />
//             ))}
//           </Section>

//           <Divider />

//           {/* VARIANT FIELDS */}
//           <Section title="Variant Fields">
//             {Object.entries(FILTER_FIELDS.variant).map(([key, cfg]) => (
//               <FieldItem
//                 key={key}
//                 label={cfg.label}
//                 onClick={() =>
//                   selectField(
//                     cfg.label,
//                     "variant",
//                     `variant.${key}`,
//                     cfg.type as FieldType
//                   )
//                 }
//               />
//             ))}
//           </Section>

//           <Divider />

//           {/* INVENTORY */}
//           <Section title="Inventory">
//             {Object.entries(FILTER_FIELDS.inventory_by_location).map(
//               ([key, cfg]) => (
//                 <FieldItem
//                   key={key}
//                   label={cfg.label}
//                   onClick={() =>
//                     selectField(
//                       cfg.label,
//                       "inventory",
//                       `inventory.${key}`,
//                       cfg.type as FieldType
//                     )
//                   }
//                 />
//               )
//             )}
//           </Section>

//           <Divider />

//           {/* METAFIELD */}
//           <Section title="Metafield">
//             <FieldItem
//               label="Custom Metafield..."
//               onClick={selectMetafield}
//             />
//           </Section>
//         </Scrollable>
//       </Modal.Section>
//     </Modal>
//   );
// }

// /* ---------- Sub-components ---------- */

// type SectionProps = {
//   title: string;
//   children: React.ReactNode;
// };

// function Section({ title, children }: SectionProps): JSX.Element {
//   return (
//     <Box paddingBlock="400">
//       <Text variant="headingSm" as="h3">
//         {title}
//       </Text>
//       <Box paddingBlock="200">{children}</Box>
//     </Box>
//   );
// }

// type FieldItemProps = {
//   label: string;
//   onClick: () => void;
// };

// function FieldItem({ label, onClick }: FieldItemProps): JSX.Element {
//   return (
//     <Box padding="200">
//       <Button fullWidth onClick={onClick}>
//         {label}
//       </Button>
//     </Box>
//   );
// }

// /* ---------- Helpers ---------- */

// function getDefaultOperator(type: FieldType): string {
//   switch (type) {
//     case "number":
//       return "eq";
//     case "date":
//       return "before";
//     case "boolean":
//       return "eq";
//     default:
//       return "contains";
//   }
// }


// web/frontend/components/FilterBuilder/FieldPickerModal.tsx

import { memo, useCallback } from "react";
import {
  Modal,
  Box,
  Text,
  Divider,
  Scrollable,
} from "@shopify/polaris";

import { FILTER_FIELDS } from "../../config/filterFields";
import { useFilterStore } from "../../stores/filterStore";
import { FieldSection } from "./FieldSection";
import { FieldItem } from "./FieldItem";

import type { FilterFieldDef } from "../../config/filterFields";

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export const FieldPickerModal = memo(function FieldPickerModal() {
  /**
   * ⚠️ FIXED:
   * Your filterStore does NOT have `ui.fieldPickerOpen` or `ui.activeRule`.
   * It exposes:
   * - fieldPickerOpen
   * - fieldPickerRule { groupIndex, ruleIndex }
   */
  const open = useFilterStore((s) => s.fieldPickerOpen);
  const activeRule = useFilterStore((s) => s.fieldPickerRule);

  const close = useFilterStore((s) => s.closeFieldPicker);
  const updateRule = useFilterStore((s) => s.updateRule);

  const handleSelect = useCallback(
    (field: FilterFieldDef) => {
      if (!activeRule) return;

      updateRule(activeRule.groupIndex, activeRule.ruleIndex, {
        fieldPath: field.fieldKey,
        fieldLabel: field.label,
        valueType: field.type,
        operator: field.operators[0], // default operator
        value:
          field.type === "boolean"
            ? "true"
            : field.type === "number"
            ? "0"
            : "",
      });

      close();
    },
    [activeRule, updateRule, close]
  );

  /**
   * ⚠️ NOTE:
   * Metafields are intentionally treated as a special-case entry point.
   * Backend will resolve namespace/key later.
   */
  const handleSelectMetafield = useCallback(() => {
    if (!activeRule) return;

    updateRule(activeRule.groupIndex, activeRule.ruleIndex, {
      fieldPath: "metafield.custom",
      fieldLabel: "Metafield",
      valueType: "string",
      operator: "eq",
      value: "",
    });

    close();
  }, [activeRule, updateRule, close]);

  if (!open || !activeRule) return null;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Select field"
      large
    >
      <Modal.Section>
        <Scrollable style={{ height: "60vh" }} shadow>
          {/* Product Fields */}
          <FieldSection
            title="Product fields"
            fields={FILTER_FIELDS.product}
            onSelect={handleSelect}
          />

          <Divider />

          {/* Variant Fields */}
          <FieldSection
            title="Variant fields"
            fields={FILTER_FIELDS.variant}
            onSelect={handleSelect}
          />

          <Divider />

          {/* Inventory Fields */}
          <FieldSection
            title="Inventory"
            fields={FILTER_FIELDS.inventory_by_location}
            onSelect={handleSelect}
          />

          <Divider />

          {/* Metafield */}
          <Box paddingBlock="400" paddingInline="400">
            <Text variant="headingSm" as="h3">
              Metafield
            </Text>

            <Box paddingBlockStart="200">
              <FieldItem
                label="Custom metafield…"
                onClick={handleSelectMetafield}
              />
            </Box>
          </Box>
        </Scrollable>
      </Modal.Section>
    </Modal>
  );
});

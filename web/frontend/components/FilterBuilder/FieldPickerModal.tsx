import {
  Modal,
  Box,
  Text,
  Button,
  Divider,
  Scrollable,
} from "@shopify/polaris";
import React from "react";

import { FILTER_FIELDS } from "../../config/filterFields";
import { useFilterStore } from "../../state/filterStore";

type RulePosition = {
  groupIndex: number;
  ruleIndex: number;
};

type FieldType = "string" | "number" | "date" | "boolean";

export default function FieldPickerModal(): JSX.Element | null {
  const open = useFilterStore((s) => s.fieldPickerOpen);
  const close = useFilterStore((s) => s.closeFieldPicker);
  const rulePos = useFilterStore((s) => s.fieldPickerRule) as RulePosition | null;
  const updateRule = useFilterStore((s) => s.updateRule);
  const rebuildAST = useFilterStore((s) => s.rebuildAST);

  if (!open || !rulePos) return null;

  const selectField = (
    label: string,
    _fieldScope: "product" | "variant" | "inventory",
    path: string,
    type: FieldType
  ): void => {
    updateRule(rulePos.groupIndex, rulePos.ruleIndex, {
      field: path,
      fieldLabel: label,
      fieldType: "standard",
      operator: getDefaultOperator(type),
    });

    rebuildAST();
    close();
  };

  const selectMetafield = (): void => {
    updateRule(rulePos.groupIndex, rulePos.ruleIndex, {
      fieldType: "metafield",
      fieldLabel: "Metafield",
    });

    rebuildAST();
    close();
  };

  return (
    <Modal open={open} onClose={close} title="Select a Field" large>
      <Modal.Section>
        <Scrollable style={{ height: "60vh" }}>
          {/* PRODUCT FIELDS */}
          <Section title="Product Fields">
            {Object.entries(FILTER_FIELDS.product).map(([key, cfg]) => (
              <FieldItem
                key={key}
                label={cfg.label}
                onClick={() =>
                  selectField(
                    cfg.label,
                    "product",
                    `product.${key}`,
                    cfg.type as FieldType
                  )
                }
              />
            ))}
          </Section>

          <Divider />

          {/* VARIANT FIELDS */}
          <Section title="Variant Fields">
            {Object.entries(FILTER_FIELDS.variant).map(([key, cfg]) => (
              <FieldItem
                key={key}
                label={cfg.label}
                onClick={() =>
                  selectField(
                    cfg.label,
                    "variant",
                    `variant.${key}`,
                    cfg.type as FieldType
                  )
                }
              />
            ))}
          </Section>

          <Divider />

          {/* INVENTORY */}
          <Section title="Inventory">
            {Object.entries(FILTER_FIELDS.inventory_by_location).map(
              ([key, cfg]) => (
                <FieldItem
                  key={key}
                  label={cfg.label}
                  onClick={() =>
                    selectField(
                      cfg.label,
                      "inventory",
                      `inventory.${key}`,
                      cfg.type as FieldType
                    )
                  }
                />
              )
            )}
          </Section>

          <Divider />

          {/* METAFIELD */}
          <Section title="Metafield">
            <FieldItem
              label="Custom Metafield..."
              onClick={selectMetafield}
            />
          </Section>
        </Scrollable>
      </Modal.Section>
    </Modal>
  );
}

/* ---------- Sub-components ---------- */

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps): JSX.Element {
  return (
    <Box paddingBlock="400">
      <Text variant="headingSm" as="h3">
        {title}
      </Text>
      <Box paddingBlock="200">{children}</Box>
    </Box>
  );
}

type FieldItemProps = {
  label: string;
  onClick: () => void;
};

function FieldItem({ label, onClick }: FieldItemProps): JSX.Element {
  return (
    <Box padding="200">
      <Button fullWidth onClick={onClick}>
        {label}
      </Button>
    </Box>
  );
}

/* ---------- Helpers ---------- */

function getDefaultOperator(type: FieldType): string {
  switch (type) {
    case "number":
      return "eq";
    case "date":
      return "before";
    case "boolean":
      return "eq";
    default:
      return "contains";
  }
}



import {
  Modal,
  Box,
  Text,
  Button,
  Divider,
  Scrollable,
} from "@shopify/polaris";

import { FILTER_FIELDS } from "../../config/filterFields";
import { useFilterStore } from "../../state/filterStore";

export default function FieldPickerModal() {
  const open = useFilterStore((s) => s.fieldPickerOpen);
  const close = useFilterStore((s) => s.closeFieldPicker);
  const rulePos = useFilterStore((s) => s.fieldPickerRule);
  const updateRule = useFilterStore((s) => s.updateRule);
  const rebuildAST = useFilterStore((s) => s.rebuildAST);

  if (!open || !rulePos) return null;

  const selectField = (label, fieldType, path, type) => {
    updateRule(rulePos.groupIndex, rulePos.ruleIndex, {
      field: path,
      fieldLabel: label,
      fieldType: "standard",
      operator: getDefaultOperator(type),
    });

    rebuildAST();
    close();
  };

  const selectMetafield = () => {
    updateRule(rulePos.groupIndex, rulePos.ruleIndex, {
      fieldType: "metafield",
      fieldLabel: "Metafield",
    });

    rebuildAST();
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Select a Field"
      large
    >
      <Modal.Section>
        <Scrollable style={{ height: "60vh" }}>
          {/* PRODUCT FIELDS */}
          <Section title="Product Fields">
            {Object.entries(FILTER_FIELDS.product).map(([key, cfg]) => (
              <FieldItem
                key={key}
                label={cfg.label}
                onClick={() =>
                  selectField(cfg.label, "product", `product.${key}`, cfg.type)
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
                  selectField(cfg.label, "variant", `variant.${key}`, cfg.type)
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
                    selectField(cfg.label, "inventory", `inventory.${key}`, cfg.type)
                  }
                />
              )
            )}
          </Section>

          <Divider />

          {/* METAFIELD */}
          <Section title="Metafield">
            <FieldItem label="Custom Metafield..." onClick={selectMetafield} />
          </Section>
        </Scrollable>
      </Modal.Section>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <Box paddingBlock="4">
      <Text variant="headingSm">{title}</Text>
      <Box paddingBlock="2">{children}</Box>
    </Box>
  );
}

function FieldItem({ label, onClick }) {
  return (
    <Box padding="2">
      <Button fullWidth onClick={onClick}>
        {label}
      </Button>
    </Box>
  );
}

function getDefaultOperator(type) {
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

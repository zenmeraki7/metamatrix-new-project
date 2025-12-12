import { TextField, Box, Text } from "@shopify/polaris";
import React, { useState } from "react";
import { shallow } from "zustand/shallow";
import { useProductStore } from "../../../state/productStore";
import { useDebounce } from "../../../utils/useDebounce";

function InventoryEditorComponent({ id }) {
  const inventory = useProductStore(
    (s) => s.productMap[id]?.inventoryLocations, // { locationId: qty }
    shallow
  );
  const updateField = useProductStore((s) => s.updateField);

  if (!inventory) return <Text>-</Text>;

  return (
    <Box padding="1">
      {Object.entries(inventory).map(([locId, qty]) => (
        <LocationQtyInput
          key={locId}
          productId={id}
          locationId={locId}
          initialQty={qty}
          updateField={updateField}
        />
      ))}
    </Box>
  );
}

function LocationQtyInput({ productId, locationId, initialQty, updateField }) {
  const [local, setLocal] = useState(initialQty);
  const debounced = useDebounce(updateField, 200);

  const onChange = (v) => {
    setLocal(v);
    debounced(productId, `inventoryLocations.${locationId}`, Number(v));
  };

  return (
    <Box paddingBlock="1">
      <Text as="span" variant="bodySm">{locationId}</Text>
      <TextField
        label=""
        type="number"
        value={String(local)}
        onChange={onChange}
      />
    </Box>
  );
}

export default React.memo(InventoryEditorComponent);

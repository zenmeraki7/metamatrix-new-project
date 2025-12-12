import { TextField } from "@shopify/polaris";
import React, { useState } from "react";
import { shallow } from "zustand/shallow";
import { useProductStore } from "../../../state/productStore";

function SKUEditorComponent({ id }) {
  const sku = useProductStore(
    (s) => s.productMap[id]?.sku,
    shallow
  );

  const updateField = useProductStore((s) => s.updateField);

  const [localValue, setLocalValue] = useState(sku);

  const onChange = (value) => {
    setLocalValue(value);
    updateField(id, "sku", value);
  };

  return (
    <TextField
      label=""
      autoComplete="off"
      value={localValue}
      onChange={onChange}
    />
  );
}

export const SKUEditor = React.memo(SKUEditorComponent);
export default SKUEditor;

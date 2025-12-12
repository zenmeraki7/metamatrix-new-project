import { Button, Popover, OptionList } from "@shopify/polaris";
import { useState } from "react";
import { useProductStore } from "../../state/productStore";

export default function ColumnSelector() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);

  const columns = useProductStore((s) => s.columns);
  const setColumns = useProductStore((s) => s.setColumns);

  return (
    <Popover
      active={open}
      activator={<Button onClick={toggle}>Columns</Button>}
      onClose={toggle}
    >
      <OptionList
        title="Visible Columns"
        onChange={(selected) => setColumns(selected)}
        selected={columns}
        options={[
          { label: "Title", value: "title" },
          { label: "Vendor", value: "vendor" },
          { label: "Price", value: "price" },
        ]}
      />
    </Popover>
  );
}

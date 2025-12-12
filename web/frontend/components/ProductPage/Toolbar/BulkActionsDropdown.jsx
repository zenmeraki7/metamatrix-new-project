import { Popover, Button, ActionList } from "@shopify/polaris";
import { useState } from "react";
import { useProductStore } from "../../state/productStore";

export default function BulkActionsDropdown() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);

  const openBulkModal = useProductStore((s) => s.openBulkModal);

  return (
    <Popover
      active={open}
      activator={<Button onClick={toggle}>Bulk Actions</Button>}
      onClose={toggle}
    >
      <ActionList
        actionRole="menuitem"
        items={[
          {
            content: "Bulk Edit",
            onAction: () => {
              toggle();
              openBulkModal();
            },
          },
          {
            content: "Bulk Export",
            onAction: () => alert("Export not implemented"),
          },
        ]}
      />
    </Popover>
  );
}

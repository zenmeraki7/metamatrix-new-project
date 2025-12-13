import {
  Modal,
  Card,
  Box,
  Text,
  Divider,
  Button,
} from "@shopify/polaris";
import { useProductStore } from "../../state/productStore";
import VirtualBulkPreviewTable from "./VirtualBulkPreviewTable";

export default function BulkPreviewModal(): JSX.Element | null {
  const open = useProductStore((s) => s.bulkPreviewOpen);
  const close = useProductStore((s) => s.closeBulkPreview);
  const bulkChanges = useProductStore((s) => s.bulkChanges);

  const ids = Object.keys(bulkChanges);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Bulk Edit Preview"
      large
    >
      <Modal.Section>
        <Card sectioned>
          <Text variant="headingSm" as="h3">
            {ids.length} products will be updated
          </Text>
          <Text tone="subdued">
            Review changes before applying them.
          </Text>
        </Card>

        <Divider />

        <VirtualBulkPreviewTable />
      </Modal.Section>

      <Modal.Section>
        <Box padding="200" alignment="right">
          <Button onClick={close}>Close</Button>
          <Button primary onClick={() => alert("Apply edits…")}>
            Apply Changes
          </Button>
        </Box>
      </Modal.Section>
    </Modal>
  );
}

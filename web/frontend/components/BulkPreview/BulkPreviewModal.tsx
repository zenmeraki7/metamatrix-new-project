import {
  Modal,
  Card,
  Box,
  Text,
  Divider,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { useProductStore } from "../../state/productStore";
import VirtualBulkPreviewTable from "./VirtualBulkPreviewTable";

export default function BulkPreviewModal() {
  const open = useProductStore((s) => s.bulkPreviewOpen);
  const close = useProductStore((s) => s.closeBulkPreview);
  const bulkChanges = useProductStore((s) => s.bulkChanges);

  const ids = Object.keys(bulkChanges);

  if (!open) return null;

  return (
    <Modal open={open} onClose={close} title="Bulk Edit Preview" size="large">
      <Modal.Section>
        <Card>
          <Box padding="400">
            <Text variant="headingSm" as="h3">
              {ids.length} products will be updated
            </Text>
            <Text as="p" tone="subdued">
              Review changes before applying them.
            </Text>
          </Box>
        </Card>

        <Divider />

        <VirtualBulkPreviewTable />
      </Modal.Section>

      <Modal.Section>
        <InlineStack align="end" gap="200">
          <Button onClick={close}>Close</Button>
          <Button variant="primary" onClick={() => alert("Apply edits…")}>
            Apply Changes
          </Button>
        </InlineStack>
      </Modal.Section>
    </Modal>
  );
}

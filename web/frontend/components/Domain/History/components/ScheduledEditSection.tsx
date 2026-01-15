import React from "react";
import { Card, TextField, EmptyState, BlockStack, Box } from "@shopify/polaris";

export default function ScheduledEditSection() {
  return (
    <BlockStack gap="400">
      <Box paddingBlockStart="200">
        <TextField
          label="Search history"
          labelHidden
          placeholder="Search history..."
          autoComplete="off"
        />
        <EmptyState heading="No Scheduled Edits" image=""></EmptyState>
      </Box>
    </BlockStack>
  );
}

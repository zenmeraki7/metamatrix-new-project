import {
  Card,
  TextField,
  IndexTable,
  Badge,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Box,
} from "@shopify/polaris";

export default function ManualEditSection() {
  const rows = [
    {
      id: "1",
      title: 'Option 1 Name - replaced "Size" with "Color"',
      status: "Completed",
      count: "3 / 3",
      user: "demo-zen-store",
      time: "1/12/2026, 5:03:28 PM",
    },
    {
      id: "2",
      title: 'Option 1 Name - removed all "Size"',
      status: "Completed",
      count: "3 / 3",
      user: "demo-zen-store",
      time: "1/12/2026, 5:02:46 PM",
    },
    {
      id: "3",
      title: 'Title - replaced "arrived" with "upper"',
      status: "Completed",
      count: "3 / 3",
      user: "demo-zen-store",
      time: "1/12/2026, 4:35:53 PM",
    },
  ];

  return (
    <BlockStack gap="400">
      <Box paddingBlockStart="500">
        <TextField
          label="Search history"
          labelHidden
          placeholder="Search history..."
          autoComplete="off"
        />
      </Box>
      <IndexTable
        resourceName={{ singular: "edit", plural: "edits" }}
        itemCount={rows.length}
        selectable={false}
        headings={[
          { title: "Title" },
          { title: "Status" },
          { title: "processedCount" },
          { title: "User" },
          { title: "Edit Time" },
          { title: "Actions" },
        ]}
      >
        {rows.map((row, index) => (
          <IndexTable.Row id={row.id} key={row.id} position={index}>
            <IndexTable.Cell>
              <Text as="span" variant="bodyMd">
                {row.title}
              </Text>
            </IndexTable.Cell>

            <IndexTable.Cell>
              <Badge tone="success">{row.status}</Badge>
            </IndexTable.Cell>

            <IndexTable.Cell>{row.count}</IndexTable.Cell>
            <IndexTable.Cell>{row.user}</IndexTable.Cell>
            <IndexTable.Cell>{row.time}</IndexTable.Cell>

            <IndexTable.Cell>
              <InlineStack gap="200">
                <Button size="slim">View</Button>
                <Button size="slim" tone="critical">
                  Undo Edit
                </Button>
              </InlineStack>
            </IndexTable.Cell>
          </IndexTable.Row>
        ))}
      </IndexTable>
    </BlockStack>
  );
}

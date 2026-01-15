import React, { useState } from "react";
import { Card, Page, Tabs, Box } from "@shopify/polaris";
import ManualEditSection from "../components/ManualEditSection";
import ScheduledEditSection from "../components/ScheduledEditSection";
import ExportHistorySection from "../components/ExportHistorySection";

export default function HistoryPage() {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      id: "edit",
      content: "Edit",
      panelID: "edit-panel",
    },
    {
      id: "export",
      content: "Export",
      panelID: "export-panel",
    },
  ];

  return (
    <Page
      fullWidth
      title="history"
      subtitle="Track all your edits, exports, and history changes in one place."
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
        {selectedTab === 0 ? <EditTabContent /> : <ExportHistorySection />}
      </Tabs>
    </Page>
  );
}

function EditTabContent() {
  const [selectedEditTab, setSelectedEditTab] = useState(0);

  const editTabs = [
    {
      id: "manual-edit",
      content: "Manual edit",
      panelID: "manual-edit-panel",
    },
    {
      id: "scheduled-edit",
      content: "Scheduled edit",
      panelID: "scheduled-edit-panel",
    },
  ];

  return (
    <Box paddingBlockStart="400">
      <Card>
        <Tabs
          tabs={editTabs}
          selected={selectedEditTab}
          onSelect={setSelectedEditTab}
        >
          {selectedEditTab === 0 ? (
            <ManualEditSection />
          ) : (
            <ScheduledEditSection />
          )}
        </Tabs>
      </Card>
    </Box>
  );
}

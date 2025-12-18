// // pages/Dashboard.tsx
// import React, { useEffect, useState } from "react";
// import { Page, Card } from "@shopify/polaris";

// export default function Dashboard() {
//   const [Chart, setChart] = useState<null | React.ComponentType<any>>(null);

//   useEffect(() => {
//     // Load chart only after first paint
//     import("../components/HeavyChart").then((m) => setChart(() => m.default));
//   }, []);

//   return (
//     <Page title="Dashboard">
//       <Card sectioned>
//         {Chart ? <Chart /> : <div>Loading metrics…</div>}
//       </Card>
//     </Page>
//   );
// }

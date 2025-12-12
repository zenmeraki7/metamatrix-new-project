import { DataTable, Thumbnail } from "@shopify/polaris";
import ProductRow from "./ProductRow";

export default function ProductTable() {
  // --- Dummy Data ---
  const products = [
    {
      id: "101",
      title: "Sample Product A",
      vendor: "BrandX",
      price: "₹499",
      image: "https://via.placeholder.com/80",
    },
    {
      id: "102",
      title: "Sample Product B",
      vendor: "BrandY",
      price: "₹799",
      image: "https://via.placeholder.com/80",
    },
    {
      id: "103",
      title: "Sample Product C",
      vendor: "BrandZ",
      price: "₹1,299",
      image: "https://via.placeholder.com/80",
    },
  ];

  const rows = products.map((p) => [
    <Thumbnail key={p.id} source={p.image} alt={p.title} />,
    p.id,
    p.title,
    p.vendor,
    p.price,
  ]);

  return (
    <DataTable
      columnContentTypes={["text", "text", "text", "text", "numeric"]}
      headings={["Image", "ID", "Title", "Vendor", "Price"]}
      rows={rows}
    />
  );
}

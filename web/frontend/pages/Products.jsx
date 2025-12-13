import { Page, Card } from "@shopify/polaris";
import ProductTable from "../components/ProductTable/ProductTable";
import { useProductStore } from "../state/productStore";

export default function Products(): JSX.Element {
  const products = useProductStore((s) => s.filtered);

  return (
    <Page title="Products">
      <Card>
        <ProductTable products={products} />
      </Card>
    </Page>
  );
}

// import { memo } from "react";
// import { InlineStack, Thumbnail, Text, Badge, Box } from "@shopify/polaris";
// import { useProductById } from "../../stores/productStore";

// interface Props {
//   id: string;
//   style: React.CSSProperties; // REQUIRED for virtualization
// }

// const areEqual = (prev: Props, next: Props): boolean => {
//   return (
//     prev.id === next.id &&
//     prev.style.transform === next.style.transform &&
//     prev.style.height === next.style.height
//   );
// };

// export const ProductRow = memo(function ProductRow({ id, style }: Props) {
//   const product = useProductById(id);
//   if (!product) return null;

//   return (
//     <Box
//       style={{
//         ...style,
//         backfaceVisibility: "hidden",
//       }}
//       paddingBlock="200"
//       paddingInline="300"
//       borderBlockEndWidth="025"
//       borderColor="border"
//       background="bg-surface"
//     >
//       <InlineStack gap="400" blockAlign="center" wrap={false}>
//         <Box style={{ width: "48px", flexShrink: 0 }}>
//           <Thumbnail
//             source={product.imageUrl ?? undefined}
//             alt={product.title}
//             size="small"
//           />
//         </Box>

//         <Box style={{ flex: 2, minWidth: "200px", overflow: "hidden" }}>
//           <Text as="span" truncate>
//             {product.title}
//           </Text>
//         </Box>

//         <Box style={{ width: "120px", flexShrink: 0 }}>
//           <Badge
//             tone={
//               product.status === "active"
//                 ? "success"
//                 : product.status === "draft"
//                 ? "attention"
//                 : undefined
//             }
//           >
//             {product.status}
//           </Badge>
//         </Box>

//         <Box style={{ flex: 1, minWidth: "120px", overflow: "hidden" }}>
//           <Text as="span" truncate>
//             {product.vendor || "—"}
//           </Text>
//         </Box>
//       </InlineStack>
//     </Box>
//   );
// }, areEqual);


// web/frontend/components/ProductTable/ProductRow.tsx 
import { memo } from "react"; 
import { InlineStack, Thumbnail, Text, Badge, Box } 
from "@shopify/polaris"; 
import { useProductById } from "../../stores/productStore"; 

interface Props 
{ id: string; 
  style: React.CSSProperties; //  REQUIRED for virtualization 
  } 
   /** * Custom equality: * - Same product ID * - Same virtual position */

   const areEqual = (prev: Props, next: Props): boolean => { 
    return (
       prev.id === next.id && 
       prev.style.transform === next.style.transform && 
       prev.style.height === next.style.height 
      );
     }; 
     export const ProductRow = memo(function ProductRow({ id, style }: Props) { 
      const product = useProductById(id); 
      if (!product) return null; 
      return ( 
      <Box 
      style={{ 
        ...style, 
        backfaceVisibility: "hidden", 
      }} 
      paddingBlock="200" 
      paddingInline="300" 
      borderBlockEndWidth="025" 
      borderColor="border" 
      background="bg-surface" >

      <InlineStack gap="400" 
      blockAlign="center" wrap={false}> 
        {/* Image */} 
        <Box style={{ width: "48px", flexShrink: 0 }}> 
          <Thumbnail source={product.imageUrl ?? undefined} alt={product.title} size="small" /> 
          </Box> 
          {/* Title */} 
          <Box style={{ flex: 2, minWidth: "200px", overflow: "hidden" }}> 
            <Text as="span" truncate> {product.title} </Text> 
          </Box> 
          {/* Status */} 
          <Box style={{ width: "120px", flexShrink: 0 }}>
             <Badge tone={ product.status === "active" ? "success" : product.status === "draft" ? "attention" : undefined } > 
              {product.status} </Badge> 
             </Box> 
          {/* Vendor */} 
          <Box style={{ flex: 1, minWidth: "120px", overflow: "hidden" }}> 
            <Text as="span" truncate> {product.vendor || "—"} </Text> 
            </Box> 
            </InlineStack> 
            </Box> ); }, areEqual);
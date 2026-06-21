
import type { LoaderFunctionArgs } from "react-router";
import { getHiddenProductsForShop } from "app/services/db/hidden-product.service";
import { authenticate } from "app/shopify.server";
import type { HiddenProduct } from "app/components/HiddenProductsTable";
import {
  getAllProducts,
  type Product,
} from "app/services/graphql/get-all-products";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  // 1. Get all hidden products from DB
  const hiddenProductsDb = await getHiddenProductsForShop(session.shop);

  // 2. Get all products from Shopify
  const allProducts = await getAllProducts(admin);

  // 3. Map between them to get additional details like titles and images
  const productsMap = createProductsMap(allProducts);

  // 4. Prepare hidden product objects with all required information
  const hiddenProducts: HiddenProduct[] = hiddenProductsDb.map(
    (hiddenProduct) => {
      const productInfo = productsMap.get(hiddenProduct.productId);

      let variantTitle = null;
      let imageUrl = productInfo?.featuredImage?.url;

      // If there's a variant ID, find the specific variant
      if (hiddenProduct.variantId && productInfo) {
        const variant = productInfo.variants.edges.find(
          ({ node }) => node.id === hiddenProduct.variantId,
        )?.node;

        if (variant) {
          variantTitle = variant.title;
        }
      }

      return {
        id: hiddenProduct.id,
        productId: hiddenProduct.productId,
        variantId: hiddenProduct.variantId,
        hiddenAt: hiddenProduct.hiddenAt.toISOString(),
        productTitle: productInfo?.title || "Unknown Product",
        variantTitle: variantTitle || "All Variants",
        imageUrl,
      };
    },
  );

  return Response.json({ hiddenProducts });
}

// Helper: Create a map of products by ID for efficient access
function createProductsMap(products: Product[]): Map<string, Product> {
  const map = new Map<string, Product>();
  products.forEach((product) => {
    map.set(product.id, product);
  });
  return map;
}

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "app/shopify.server";
import db from "app/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const productId = formData.get("productId") as string;
  const variantId = formData.get("variantId") || null;

  // Find the shop
  const shop = await db.shop.findUnique({
    where: { shopifyDomain: session.shop },
  });

  if (!shop) {
    return new Response("Shop not found", { status: 404 });
  }

  // Find the hidden product
  const variantCondition = variantId
    ? { variantId: String(variantId) }
    : { variantId: null };

  const hiddenProduct = await db.hiddenProduct.findFirst({
    where: {
      shopId: shop.id,
      productId,
      ...variantCondition,
    },
  });

  if (!hiddenProduct) {
    return new Response("Hidden product not found", { status: 404 });
  }

  // Delete the hidden product
  await db.hiddenProduct.delete({
    where: {
      id: hiddenProduct.id,
    },
  });

  return new Response("Product unhidden successfully", { status: 200 });
}

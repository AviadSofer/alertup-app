import type { ActionFunctionArgs } from "react-router";
import { hideProductForShop } from "app/services/db/hidden-product.service";
import { authenticate } from "app/shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const variantId = formData.get("variantId") as string;

  await hideProductForShop(session.shop, productId, variantId);

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

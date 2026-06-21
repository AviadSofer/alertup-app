import db from "../../db.server";

export async function hideProductForShop(
  shopifyDomain: string,
  productId: string,
  variantId?: string,
) {
  const shop = await db.shop.findUnique({
    where: {
      shopifyDomain,
    },
  });

  if (!shop) {
    throw new Error(`Shop not found for domain: ${shopifyDomain}`);
  }

  if (!productId) {
    throw new Error("Product ID is required");
  }

  const variantCondition =
    typeof variantId === "string" ? { variantId } : { variantId: null };

  try {
    const existingHiddenProduct = await db.hiddenProduct.findFirst({
      where: {
        shopId: shop.id,
        productId,
        ...variantCondition,
      },
    });

    if (existingHiddenProduct) {
      return await db.hiddenProduct.update({
        where: {
          id: existingHiddenProduct.id,
        },
        data: {
          hiddenAt: new Date(),
        },
      });
    } else {
      return await db.hiddenProduct.create({
        data: {
          shopId: shop.id,
          productId,
          ...variantCondition,
          hiddenAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Error hiding product:", error);
    throw error;
  }
}

export async function getHiddenProductsForShop(shopifyDomain: string) {
  const shop = await db.shop.findUnique({
    where: {
      shopifyDomain,
    },
  });

  if (!shop) {
    return [];
  }

  return await db.hiddenProduct.findMany({
    where: {
      shopId: shop.id,
    },
  });
}

export async function isProductHiddenForShop(
  shopifyDomain: string,
  productId: string,
  variantId?: string,
): Promise<boolean> {
  const shop = await db.shop.findUnique({
    where: {
      shopifyDomain,
    },
  });

  if (!shop) {
    return false;
  }

  const variantCondition =
    typeof variantId === "string" ? { variantId } : { variantId: null };

  const count = await db.hiddenProduct.count({
    where: {
      shopId: shop.id,
      productId,
      ...variantCondition,
    },
  });

  return count > 0;
}

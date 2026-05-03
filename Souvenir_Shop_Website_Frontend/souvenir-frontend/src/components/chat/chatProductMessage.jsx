const PRODUCT_PREFIX = "[[PRODUCT]]";

export const buildProductChatMessage = (product) => {
  const productId = product?.productId ?? product?.id ?? null;

  const payload = {
    productId,
    name: product?.name ?? product?.productName ?? product?.slug ?? "",
    slug: product?.slug ?? "",
    imageUrl: product?.imageUrl ?? product?.thumbnail ?? "",
    price: product?.price ?? product?.basePrice ?? 0,
    variantName: product?.variantName ?? "",
    url: product?.url ?? (productId ? `/products/${productId}` : "/products"),
  };

  return `${PRODUCT_PREFIX}${JSON.stringify(payload)}`;
};

export const parseProductChatMessage = (content) => {
  if (!content || typeof content !== "string") return null;
  if (!content.startsWith(PRODUCT_PREFIX)) return null;

  try {
    const json = content.slice(PRODUCT_PREFIX.length);
    const product = JSON.parse(json);

    return {
      type: "product",
      product,
    };
  } catch {
    return null;
  }
};

export const isProductChatMessage = (content) => {
  return typeof content === "string" && content.startsWith(PRODUCT_PREFIX);
};
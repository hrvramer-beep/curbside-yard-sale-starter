import type { APIRoute } from "astro";
import { SITE_NAME } from "../../../site.config.mjs";
import {
  absolutePhotoUrls,
  entryText,
  feedAvailability,
  flatShipping,
  itemPath,
  loadVisibleItems,
} from "../../lib/catalog";

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("SITE_URL is missing.");
  const items = await loadVisibleItems();
  const products = [];
  for (const item of items) {
    const images = await absolutePhotoUrls(item, site);
    products.push({
      id: item.id,
      title: item.data.title,
      description: entryText(item),
      url: new URL(itemPath(item.id), site).href,
      images: images.map((image) => image.src),
      price: item.data.price,
      currency: "USD",
      shipping: flatShipping(item),
      condition: item.data.condition,
      availability: feedAvailability(item.data.status),
      ...(item.data.gtin ? { gtin: item.data.gtin } : {}),
      ...(item.data.mpn ? { mpn: item.data.mpn } : {}),
      ...(typeof item.data.quantity === "number" ? { quantity: item.data.quantity } : {}),
      ...(item.data.status === "available" && item.data.paymentLink
        ? { checkout_url: item.data.paymentLink }
        : {}),
    });
  }

  const body = {
    store: SITE_NAME,
    currency: "USD",
    products,
  };

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};

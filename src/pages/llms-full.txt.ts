import type { APIRoute } from "astro";
import { POLICIES, SITE_NAME, SITE_TAGLINE } from "../../site.config.mjs";
import {
  conditionLabel,
  entryText,
  feedAvailability,
  flatShipping,
  itemPath,
  loadVisibleItems,
  usd,
} from "../lib/catalog";
import { shippedPrice } from "../lib/jsonld";

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("SITE_URL is missing.");
  const available = (await loadVisibleItems()).filter((item) => item.data.status === "available");
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE}`,
    "",
    POLICIES.llmsFullIntro,
    "",
    "## Available items",
    "",
  ];

  if (available.length === 0) {
    lines.push("No items are available right now.");
  }

  for (const item of available) {
    const url = new URL(itemPath(item.id), site).href;
    lines.push(
      `### ${item.data.title}`,
      "",
      `- URL: ${url}`,
      `- Price: ${usd(item.data.price)} USD`,
      `- Shipping: ${usd(flatShipping(item))} USD`,
      `- Shipped total: ${usd(shippedPrice(item))} USD`,
      `- Condition: ${conditionLabel[item.data.condition]}`,
      `- Availability: ${feedAvailability(item.data.status)}`,
      `- Category: ${item.data.category}`,
      `- Brand: ${item.data.brand}`,
      `- Checkout: ${item.data.paymentLink || "(none)"}`,
      "",
      entryText(item) || "(no description)",
      "",
    );
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

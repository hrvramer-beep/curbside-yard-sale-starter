import type { APIRoute } from "astro";
import { POLICIES, SITE_NAME, SITE_TAGLINE } from "../../site.config.mjs";
import {
  conditionLabel,
  feedAvailability,
  flatShipping,
  itemPath,
  loadVisibleItems,
  usd,
} from "../lib/catalog";
import { shippedPrice } from "../lib/jsonld";

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("SITE_URL is missing.");
  const origin = new URL("/", site).href;
  const available = (await loadVisibleItems()).filter((item) => item.data.status === "available");
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE}`,
    "",
    POLICIES.llmsIntro,
    "",
    "## Available items",
    "",
  ];

  if (available.length === 0) {
    lines.push("No items are available right now.");
  } else {
    for (const item of available) {
      const url = new URL(itemPath(item.id), site).href;
      lines.push(
        `- [${item.data.title}](${url}): ${usd(item.data.price)} plus ${usd(flatShipping(item))} shipping (${usd(shippedPrice(item))} shipped). Condition: ${conditionLabel[item.data.condition]}. Availability: ${feedAvailability(item.data.status)}.`,
      );
    }
  }

  lines.push(
    "",
    "## More",
    "",
    `- [Home](${origin})`,
    `- [Shipping, pickup, and policies](${new URL("/about", site).href})`,
    `- [Contact](${new URL("/contact", site).href})`,
    `- [JSON product feed](${new URL("/feeds/products.json", site).href})`,
    `- [Google Merchant feed](${new URL("/feeds/google-merchant.xml", site).href})`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

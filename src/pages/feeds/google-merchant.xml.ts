import type { APIRoute } from "astro";
import { SITE_NAME, SITE_TAGLINE } from "../../../site.config.mjs";
import {
  absolutePhotoUrls,
  entryText,
  feedAvailability,
  flatShipping,
  googleCondition,
  itemPath,
  loadVisibleItems,
  xmlEscape,
} from "../../lib/catalog";

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("SITE_URL is missing.");
  const items = await loadVisibleItems();
  const origin = new URL("/", site).href;
  const blocks = [];

  for (const item of items) {
    const images = await absolutePhotoUrls(item, site);
    const [primary, ...extra] = images;
    const lines = [
      "    <item>",
      `      <g:id>${xmlEscape(item.id)}</g:id>`,
      `      <g:title>${xmlEscape(item.data.title)}</g:title>`,
      `      <g:description>${xmlEscape(entryText(item) || item.data.title)}</g:description>`,
      `      <g:link>${xmlEscape(new URL(itemPath(item.id), site).href)}</g:link>`,
      `      <g:image_link>${xmlEscape(primary.src)}</g:image_link>`,
    ];
    for (const image of extra) {
      lines.push(`      <g:additional_image_link>${xmlEscape(image.src)}</g:additional_image_link>`);
    }
    lines.push(
      `      <g:availability>${feedAvailability(item.data.status)}</g:availability>`,
      `      <g:price>${item.data.price.toFixed(2)} USD</g:price>`,
      `      <g:condition>${googleCondition[item.data.condition]}</g:condition>`,
      `      <g:brand>${xmlEscape(item.data.brand)}</g:brand>`,
    );
    if (item.data.gtin) lines.push(`      <g:gtin>${xmlEscape(item.data.gtin)}</g:gtin>`);
    if (item.data.mpn) lines.push(`      <g:mpn>${xmlEscape(item.data.mpn)}</g:mpn>`);
    if (!item.data.gtin && !item.data.mpn) lines.push("      <g:identifier_exists>no</g:identifier_exists>");
    const shipping = flatShipping(item);
    if (typeof shipping === "number") {
      lines.push(
        "      <g:shipping>",
        "        <g:country>US</g:country>",
        "        <g:service>Standard</g:service>",
        `        <g:price>${shipping.toFixed(2)} USD</g:price>`,
        "      </g:shipping>",
      );
    }
    if (item.data.weight) {
      lines.push(`      <g:shipping_weight>${item.data.weight.toFixed(2)} lb</g:shipping_weight>`);
    }
    if (item.data.googleProductCategory) {
      lines.push(
        `      <g:google_product_category>${xmlEscape(item.data.googleProductCategory)}</g:google_product_category>`,
      );
    }
    lines.push("    </item>");
    blocks.push(lines.join("\n"));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(SITE_NAME)}</title>
    <link>${xmlEscape(origin)}</link>
    <description>${xmlEscape(SITE_TAGLINE)}</description>
${blocks.join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};

import { getCollection, type CollectionEntry } from "astro:content";
import { getImage } from "astro:assets";

export type ItemEntry = CollectionEntry<"items">;

export type Condition = ItemEntry["data"]["condition"];
export type ItemStatus = ItemEntry["data"]["status"];

export function draftsVisible(): boolean {
  const flag = import.meta.env.INCLUDE_DRAFTS;
  return import.meta.env.DEV || flag === true || flag === "true";
}

export async function loadVisibleItems(): Promise<ItemEntry[]> {
  const items = await getCollection("items");
  return items
    .filter((item) => draftsVisible() || item.data.draft !== true)
    .sort((a, b) => b.data.listedAt.getTime() - a.data.listedAt.getTime());
}

export function groupItems(items: ItemEntry[]) {
  const pick = (status: ItemStatus) => items.filter((item) => item.data.status === status);
  return {
    available: pick("available"),
    pending: pick("pending"),
    sold: pick("sold"),
  };
}

export function itemPath(id: string): string {
  return `/items/${id}`;
}

export function addMoney(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

/** US flat shipping rate. The optional `shipping` field overrides `shippingPrice`. */
export function flatShipping(entry: ItemEntry): number {
  return typeof entry.data.shipping === "number" ? entry.data.shipping : entry.data.shippingPrice;
}

export function usd(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const [dollars, cents] = Math.abs(amount).toFixed(2).split(".");
  const withCommas = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${withCommas}.${cents}`;
}

export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_~>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function entryText(entry: ItemEntry): string {
  return plainText(entry.body ?? "");
}

export function metaDescription(text: string, fallback: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  if (clean.length <= 160) return clean;
  const cut = clean.slice(0, 157);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : 157)}…`;
}

export const conditionLabel: Record<Condition, string> = {
  new: "New",
  "like-new": "Like new",
  good: "Good",
  fair: "Fair",
  "for-parts": "For parts",
};

/** schema.org Offer itemCondition URLs. */
export const schemaCondition: Record<Condition, string> = {
  new: "https://schema.org/NewCondition",
  "like-new": "https://schema.org/UsedCondition",
  good: "https://schema.org/UsedCondition",
  fair: "https://schema.org/UsedCondition",
  "for-parts": "https://schema.org/DamagedCondition",
};

/** Google Merchant Center condition values. like-new, good, and fair are used goods. */
export const googleCondition: Record<Condition, "new" | "used"> = {
  new: "new",
  "like-new": "used",
  good: "used",
  fair: "used",
  "for-parts": "used",
};

export function schemaAvailability(status: ItemStatus): string {
  if (status === "available") return "https://schema.org/InStock";
  if (status === "pending") return "https://schema.org/LimitedAvailability";
  return "https://schema.org/SoldOut";
}

/** Sold and pending listings are not for sale, so feeds report them out of stock. */
export function feedAvailability(status: ItemStatus): "in_stock" | "out_of_stock" {
  return status === "available" ? "in_stock" : "out_of_stock";
}

export function statusLabel(status: ItemStatus): string {
  if (status === "available") return "Available";
  if (status === "pending") return "Pending";
  return "Sold";
}

const PHOTO_FORMATS = new Set(["jpg", "jpeg", "png"]);

export async function absolutePhotoUrls(entry: ItemEntry, site: URL) {
  const urls = [];
  for (const photo of entry.data.photos) {
    const format = String(photo.src.format ?? "").toLowerCase();
    if (!PHOTO_FORMATS.has(format)) {
      const shown = format ? `.${format}` : "an unknown format";
      throw new Error(
        `Item photo must be a .jpg, .jpeg, or .png file (found ${shown}). SVG and other formats are not supported.`,
      );
    }
    const image = await getImage({
      src: photo.src,
      width: 1200,
      height: 900,
      format: "jpeg",
    });
    urls.push({
      src: new URL(image.src, site).href,
      alt: photo.alt,
    });
  }
  return urls;
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 13-digit codes use schema.org `gtin13`. Every other length uses `gtin`. */
export function gtinProperty(gtin: string): "gtin13" | "gtin" {
  return /^\d{13}$/.test(gtin) ? "gtin13" : "gtin";
}

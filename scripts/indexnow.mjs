import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSiteUrl, INDEXNOW_KEY, INDEXNOW_KEY_PLACEHOLDER, isPlaceholderSiteUrl } from "../site.config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (INDEXNOW_KEY === INDEXNOW_KEY_PLACEHOLDER) {
  console.log(
    "IndexNow skipped. INDEXNOW_KEY is still the placeholder. Replace it in site.config.mjs and run this again.",
  );
  process.exit(0);
}

const siteUrl = getSiteUrl();
if (isPlaceholderSiteUrl(siteUrl)) {
  console.log(
    `IndexNow skipped. SITE_URL is still the placeholder (${siteUrl}). Set SITE_URL to the live https origin and run this again.`,
  );
  process.exit(0);
}

let urlList = process.argv.slice(2).filter(Boolean);
if (urlList.length === 0) {
  const feedPath = path.join(root, "dist", "feeds", "products.json");
  let feed;
  try {
    feed = JSON.parse(await readFile(feedPath, "utf8"));
  } catch {
    console.error("Build the site first so dist/feeds/products.json exists, or pass item URLs as arguments.");
    process.exit(1);
  }
  const products = Array.isArray(feed.products) ? feed.products : [];
  urlList = [new URL("/", siteUrl).href, ...products.map((product) => product.url)].filter(Boolean);
}

urlList = [...new Set(urlList)];
if (urlList.length === 0) {
  console.log("IndexNow skipped. There are no URLs to submit.");
  process.exit(0);
}

const host = new URL(siteUrl).host;
const body = {
  host,
  key: INDEXNOW_KEY,
  keyLocation: new URL(`/${INDEXNOW_KEY}.txt`, `${siteUrl}/`).href,
  urlList,
};

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

if (!response.ok) {
  const detail = await response.text();
  console.error(`IndexNow failed (${response.status}). ${detail}`);
  process.exit(1);
}

console.log(`IndexNow accepted ${urlList.length} URL(s) for ${host} (${response.status}).`);

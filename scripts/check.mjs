import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { parse } from "yaml";
import { CONTACT_FORM, INDEXNOW_KEY } from "../site.config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const itemsDir = path.join(root, "src", "content", "items");
const requiredBots = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isStripePaymentLink(value) {
  if (value === undefined || value === null || String(value).trim() === "") return true;
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "https:" && url.hostname === "buy.stripe.com" && url.pathname.length > 1;
  } catch {
    return false;
  }
}

function photoExtension(value) {
  const clean = String(value).split(/[?#]/)[0];
  const match = clean.match(/\.([A-Za-z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function formatUsd(amount) {
  const [dollars, cents] = Math.abs(amount).toFixed(2).split(".");
  const withCommas = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${withCommas}.${cents}`;
}

async function readItems() {
  const files = (await readdir(itemsDir)).filter((name) => name.endsWith(".md")).sort();
  const items = [];
  for (const name of files) {
    const full = path.join(itemsDir, name);
    const raw = await readFile(full, "utf8");
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      fail(`${name} is missing frontmatter`);
      continue;
    }
    const data = parse(match[1]);
    const slug = name.replace(/\.md$/, "");
    items.push({ slug, file: full, data, body: match[2] });
  }
  return items;
}

function checkSource(items) {
  for (const item of items) {
    const photos = item.data.photos;
    assert(Array.isArray(photos) && photos.length > 0, `${item.slug} needs at least one photo`);
    if (!Array.isArray(photos)) continue;
    photos.forEach((photo, index) => {
      const alt = typeof photo?.alt === "string" ? photo.alt.trim() : "";
      assert(alt.length >= 20, `${item.slug} photo ${index + 1} needs descriptive alt text (20+ characters)`);
      assert(!/^(image|photo|picture|img|alt|placeholder)$/i.test(alt), `${item.slug} photo ${index + 1} alt is not descriptive`);
      const src = photo?.src;
      assert(typeof src === "string" && src.length > 0, `${item.slug} photo ${index + 1} is missing src`);
      if (typeof src === "string") {
        const ext = photoExtension(src);
        assert(
          ext === "jpg" || ext === "jpeg" || ext === "png",
          `${item.slug} photo ${index + 1} must be a .jpg, .jpeg, or .png file (${src} is ${ext ? `.${ext}` : "missing an extension"}). SVG and other formats are not allowed.`,
        );
        const absolute = path.resolve(path.dirname(item.file), src);
        assert(
          absolute.startsWith(path.join(root, "src", "assets", "items", item.slug) + path.sep),
          `${item.slug} photo ${index + 1} must live in src/assets/items/${item.slug}/`,
        );
        if ((ext === "jpg" || ext === "jpeg" || ext === "png") && absolute.startsWith(path.join(root, "src", "assets", "items", item.slug) + path.sep)) {
          let bytes;
          try {
            bytes = readFileSync(absolute);
          } catch {
            fail(`${item.slug} photo ${index + 1} could not be read at ${src}`);
            bytes = null;
          }
          if (bytes) {
            const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
            const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
            const text = bytes.subarray(0, 240).toString("utf8").trimStart().toLowerCase();
            const svg = text.startsWith("<svg") || text.startsWith("<?xml") || text.includes("<svg");
            assert(
              (jpeg || png) && !svg,
              `${item.slug} photo ${index + 1} must be a .jpg, .jpeg, or .png file. ${svg ? `${src} is an SVG.` : `${src} is not a JPEG or PNG.`} SVG and other formats are not allowed.`,
            );
          }
        }
      }
    });
    assert(typeof item.body === "string" && item.body.trim().length > 0, `${item.slug} needs a description`);
    assert(
      isStripePaymentLink(item.data.paymentLink),
      `${item.slug} paymentLink must be an https://buy.stripe.com/ URL`,
    );
    assert(
      isStripePaymentLink(item.data.pairPaymentLink),
      `${item.slug} pairPaymentLink must be an https://buy.stripe.com/ URL`,
    );
    if (item.data.quantity !== undefined && item.data.quantity !== null && item.data.quantity !== "") {
      assert(
        typeof item.data.quantity === "number" && Number.isInteger(item.data.quantity) && item.data.quantity >= 1,
        `${item.slug} quantity must be a whole number of at least 1`,
      );
    }
    for (const field of ["pairPrice", "shipping", "shippedPrice", "pairShippedPrice"]) {
      const value = item.data[field];
      if (value === undefined || value === null || value === "") continue;
      assert(typeof value === "number" && Number.isFinite(value), `${item.slug} ${field} must be a number`);
    }
  }
}

function build(includeDrafts) {
  const env = { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" };
  if (includeDrafts) env.INCLUDE_DRAFTS = "true";
  else delete env.INCLUDE_DRAFTS;
  const result = spawnSync("npm", ["exec", "--", "astro", "build"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`astro build failed (INCLUDE_DRAFTS=${includeDrafts ? "true" : "false"})`);
  }
}

async function walk(dir) {
  const found = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(full)));
    else found.push(full);
  }
  return found;
}

function asArray(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

async function checkDraftBuild(items) {
  const dist = path.join(root, "dist");
  const htmlFiles = (await walk(dist)).filter((file) => file.endsWith(".html"));
  const itemPages = htmlFiles.filter((file) => file.includes(`${path.sep}items${path.sep}`));
  assert(itemPages.length === items.length, `expected ${items.length} item pages in the draft build, found ${itemPages.length}`);

  for (const file of itemPages) {
    const html = await readFile(file, "utf8");
    const slug = path.basename(path.dirname(file));
    const source = items.find((item) => item.slug === slug);
    assert(source, `built page ${file} does not match a content file`);
    for (const match of html.matchAll(/<img\b[^>]*>/g)) {
      assert(/\salt(?:[\s=/>]|$)/.test(match[0]), `${slug} has an img without an alt attribute`);
    }
    if (source) {
      for (const photo of source.data.photos) {
        assert(html.includes(photo.alt), `${slug} page is missing alt text: ${photo.alt}`);
      }
    }
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) =>
      match[1],
    );
    assert(scripts.length > 0, `${slug} is missing JSON-LD`);
    let product;
    for (const raw of scripts) {
      let data;
      try {
        data = JSON.parse(raw);
      } catch (error) {
        fail(`${slug} JSON-LD did not parse: ${error.message}`);
        continue;
      }
      if (data["@type"] === "Product") product = data;
    }
    assert(product, `${slug} JSON-LD has no Product`);
    if (!product) continue;
    assert(product.sku === slug, `${slug} JSON-LD sku mismatch`);
    assert(typeof product.name === "string" && product.name.length > 0, `${slug} JSON-LD name`);
    assert(typeof product.description === "string" && product.description.length > 0, `${slug} JSON-LD description`);
    assert(Array.isArray(product.image) && product.image.length > 0, `${slug} JSON-LD image`);
    assert(product.brand?.name, `${slug} JSON-LD brand`);
    assert(product.offers?.priceCurrency === "USD", `${slug} JSON-LD priceCurrency`);
    assert(typeof product.offers?.price === "string", `${slug} JSON-LD price`);
    assert(typeof product.offers?.availability === "string", `${slug} JSON-LD availability`);
    assert(typeof product.offers?.url === "string" && product.offers.url.includes(`/items/${slug}`), `${slug} JSON-LD url`);
    assert(product.offers?.shippingDetails?.["@type"] === "OfferShippingDetails", `${slug} JSON-LD shippingDetails`);
    assert(
      product.offers?.hasMerchantReturnPolicy?.["@type"] === "MerchantReturnPolicy",
      `${slug} JSON-LD hasMerchantReturnPolicy`,
    );
    assert(typeof product.itemCondition === "string" && product.itemCondition.startsWith("https://schema.org/"), `${slug} itemCondition`);
    const hasOfferForm = html.includes(`name="${CONTACT_FORM.formName}"`);
    if (source?.data.status === "sold") {
      assert(product.offers.availability.endsWith("SoldOut"), `${slug} should be SoldOut`);
      assert(html.includes("status-sold"), `${slug} page should show Sold`);
      assert(!html.includes('class="buy"'), `${slug} should hide the Buy button`);
      assert(!hasOfferForm, `${slug} offer form should render only when the item is available`);
    }
    if (source?.data.status === "available") {
      assert(hasOfferForm, `${slug} available page should include the offer form`);
    } else if (source) {
      assert(!hasOfferForm, `${slug} offer form should render only when the item is available`);
    }
    if (source?.data.gtin) {
      const code = String(source.data.gtin);
      const key = /^\d{13}$/.test(code) ? "gtin13" : "gtin";
      assert(product[key] === code, `${slug} JSON-LD should set ${key}`);
      if (key === "gtin13") assert(product.gtin === undefined, `${slug} JSON-LD should use gtin13, not gtin, for a 13-digit code`);
    }
    if (source?.data.mpn) assert(product.mpn === String(source.data.mpn), `${slug} JSON-LD mpn`);
    if (source?.data.status === "available" && source.data.paymentLink) {
      assert(product.offers.availability.endsWith("InStock"), `${slug} should be InStock`);
      assert(html.includes(`class="buy" href="${source.data.paymentLink}"`), `${slug} should show the Buy button`);
      if (typeof source.data.shippedPrice === "number") {
        assert(
          html.includes(`Buy one, shipped: ${formatUsd(source.data.shippedPrice)}`),
          `${slug} should label the single buy button with the shipped price`,
        );
      } else {
        assert(html.includes(">Buy</a>"), `${slug} should use the Buy label when shippedPrice is missing`);
      }
    }
    if (source?.data.status === "available" && source.data.pairPaymentLink) {
      assert(
        html.includes(`class="buy" href="${source.data.pairPaymentLink}"`),
        `${slug} should show the pair buy button`,
      );
      if (typeof source.data.pairShippedPrice === "number") {
        assert(
          html.includes(`Buy both, shipped: ${formatUsd(source.data.pairShippedPrice)}`),
          `${slug} should label the pair buy button with the pair shipped price`,
        );
      }
    }
    if (source?.data.status === "available") {
      const stockBits = [];
      if (typeof source.data.quantity === "number") stockBits.push(`${source.data.quantity} available`);
      if (typeof source.data.pairPrice === "number") stockBits.push(`${formatUsd(source.data.pairPrice)} for both`);
      if (stockBits.length > 0) {
        assert(html.includes(stockBits.join(", ")), `${slug} should show quantity and pair price`);
      }
    }
    assert(html.includes('rel="canonical"'), `${slug} missing canonical`);
    assert(html.includes('property="og:image"'), `${slug} missing Open Graph image`);
  }

  const home = await readFile(path.join(dist, "index.html"), "utf8");
  const homeLd = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) =>
    JSON.parse(match[1]),
  );
  assert(
    homeLd.some((block) => block["@type"] === "WebSite"),
    "home page is missing WebSite JSON-LD",
  );
  const availableItem = items.find((item) => item.data.status === "available");
  const soldItem = items.find((item) => item.data.status === "sold");
  if (availableItem && soldItem) {
    const availableAt = home.indexOf(availableItem.data.title);
    const soldAt = home.indexOf(soldItem.data.title);
    assert(availableAt >= 0 && soldAt > availableAt, "home page should list available items before sold items");
  }

  const products = JSON.parse(await readFile(path.join(dist, "feeds", "products.json"), "utf8"));
  assert(Array.isArray(products.products), "products.json needs a products array");
  assert(products.products.length === items.length, "products.json should list every visible item");
  for (const product of products.products) {
    for (const key of ["id", "title", "description", "url", "images", "price", "currency", "shipping", "condition", "availability"]) {
      assert(key in product, `products.json item missing ${key}`);
    }
    assert(product.currency === "USD", "products.json currency");
    assert(product.availability === "in_stock" || product.availability === "out_of_stock", "products.json availability");
    const sourceItem = items.find((item) => item.slug === product.id);
    if (sourceItem?.data.gtin) assert(product.gtin === String(sourceItem.data.gtin), `${product.id} products.json gtin`);
    else assert(!("gtin" in product), `${product.id} products.json should omit gtin when it is unset`);
    if (sourceItem?.data.mpn) assert(product.mpn === String(sourceItem.data.mpn), `${product.id} products.json mpn`);
    else assert(!("mpn" in product), `${product.id} products.json should omit mpn when it is unset`);
    if (typeof sourceItem?.data.quantity === "number") {
      assert(product.quantity === sourceItem.data.quantity, `${product.id} products.json quantity`);
    } else {
      assert(!("quantity" in product), `${product.id} products.json should omit quantity when it is unset`);
    }
    const paymentLink = String(sourceItem?.data.paymentLink ?? "").trim();
    if (product.availability === "in_stock" && paymentLink) {
      assert("checkout_url" in product, `${product.id} should emit checkout_url while available with a payment link`);
      assert(product.checkout_url === paymentLink, `${product.id} checkout_url should stay paymentLink`);
      assert(isStripePaymentLink(product.checkout_url), `${product.id} checkout_url must be an https://buy.stripe.com/ URL`);
    } else {
      assert(!("checkout_url" in product), `${product.id} should omit checkout_url when it is unavailable or the payment link is empty`);
    }
  }

  const about = await readFile(path.join(dist, "about", "index.html"), "utf8");
  assert(!about.includes("You can still send a message"), "about page should not invite a message on a sold listing");
  assert(about.includes("The offer form is only on available listings."), "about page should limit the offer form to available listings");

  const merchant = await readFile(path.join(dist, "feeds", "google-merchant.xml"), "utf8");
  const valid = XMLValidator.validate(merchant);
  assert(valid === true, `google merchant feed is not well-formed XML: ${JSON.stringify(valid)}`);
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(merchant);
  const channelItems = asArray(parsed?.rss?.channel?.item);
  assert(channelItems.length === items.length, "merchant feed item count");
  for (const entry of channelItems) {
    for (const key of ["g:id", "g:title", "g:description", "g:link", "g:image_link", "g:availability", "g:price", "g:condition", "g:brand"]) {
      assert(entry[key], `merchant item missing ${key}`);
    }
    const hasId = entry["g:gtin"] || entry["g:mpn"];
    if (!hasId) assert(entry["g:identifier_exists"] === "no", "merchant item missing identifier_exists");
    else assert(entry["g:identifier_exists"] === undefined, "merchant item should set identifier_exists only when gtin and mpn are both missing");
    assert(entry["g:shipping"]?.["g:country"] === "US", "merchant item shipping should be US");
    assert(entry["g:shipping"]?.["g:price"], "merchant item missing shipping price");
    const sourceItem = items.find((item) => item.slug === entry["g:id"]);
    if (sourceItem?.data.gtin) {
      assert(merchant.includes(`<g:gtin>${String(sourceItem.data.gtin)}</g:gtin>`), `${sourceItem.slug} merchant g:gtin`);
    }
    if (sourceItem?.data.mpn) {
      assert(merchant.includes(`<g:mpn>${String(sourceItem.data.mpn)}</g:mpn>`), `${sourceItem.slug} merchant g:mpn`);
    }
  }

  const robots = await readFile(path.join(dist, "robots.txt"), "utf8");
  for (const bot of requiredBots) assert(robots.includes(`User-agent: ${bot}`), `robots.txt missing ${bot}`);
  assert(robots.includes("Allow: /"), "robots.txt should allow crawling");
  assert(robots.includes("Sitemap: https://example.com/sitemap-index.xml"), "robots.txt sitemap line");

  const llms = await readFile(path.join(dist, "llms.txt"), "utf8");
  const llmsFull = await readFile(path.join(dist, "llms-full.txt"), "utf8");
  for (const item of items) {
    const pathBit = `/items/${item.slug}`;
    if (item.data.status === "available") {
      assert(llms.includes(pathBit), `llms.txt should list ${item.slug}`);
      assert(llmsFull.includes(pathBit), `llms-full.txt should list ${item.slug}`);
    } else {
      assert(!llms.includes(pathBit), `llms.txt should omit ${item.slug}`);
      assert(!llmsFull.includes(pathBit), `llms-full.txt should omit ${item.slug}`);
    }
  }

  const keyFile = await readFile(path.join(dist, `${INDEXNOW_KEY}.txt`), "utf8");
  assert(keyFile.trim() === INDEXNOW_KEY, "IndexNow key file mismatch");

  const contact = await readFile(path.join(dist, "contact", "index.html"), "utf8");
  assert(!contact.includes("mailto:"), "contact page should not publish an email address");
  assert(contact.includes(`name="${CONTACT_FORM.formName}"`), "contact form should use the configured form name");
  assert(contact.includes('data-netlify="true"'), "contact form should be a Netlify form");
  assert(contact.includes('data-netlify-honeypot="bot-field"'), "contact form needs a honeypot");
  assert(contact.includes('name="bot-field"'), "honeypot field missing");
}

async function checkProductionBuild() {
  const dist = path.join(root, "dist");
  const files = await walk(dist);
  const html = [];
  for (const file of files.filter((name) => name.endsWith(".html") || name.endsWith(".xml") || name.endsWith(".txt") || name.endsWith(".json"))) {
    html.push(await readFile(file, "utf8"));
  }
  const combined = html.join("\n");
  for (const item of items) {
    if (item.data.draft === true) {
      assert(!combined.includes(item.slug), `production build still contains draft slug ${item.slug}`);
    }
  }
  const live = items.filter((item) => item.data.draft !== true);
  const products = JSON.parse(await readFile(path.join(dist, "feeds", "products.json"), "utf8"));
  assert(Array.isArray(products.products), "production JSON feed needs a products array");
  assert(products.products.length === live.length, "production JSON feed should list published items and exclude drafts");
  for (const product of products.products) {
    const sourceItem = live.find((item) => item.slug === product.id);
    assert(sourceItem, `${product.id} is not a published item`);
    const paymentLink = String(sourceItem?.data.paymentLink ?? "").trim();
    const expectCheckout = product.availability === "in_stock" && paymentLink.length > 0;
    assert(
      expectCheckout ? "checkout_url" in product : !("checkout_url" in product),
      `${product.id} checkout_url should be present only while available with a payment link`,
    );
  }
  const merchant = await readFile(path.join(dist, "feeds", "google-merchant.xml"), "utf8");
  assert(XMLValidator.validate(merchant) === true, "production merchant feed is not well-formed");
  const parsed = new XMLParser().parse(merchant);
  const channelItems = asArray(parsed?.rss?.channel?.item);
  assert(parsed?.rss?.channel, "production merchant feed is missing a channel");
  assert(channelItems.length === live.length, "production merchant feed should list published items and exclude drafts");
}

const readme = await readFile(path.join(root, "README.md"), "utf8");
assert(readme.includes("## Adding an item"), "README needs an Adding an item section");
assert(
  readme.includes(".jpg") && readme.includes(".jpeg") && readme.includes(".png"),
  "README adding-items section should require .jpg, .jpeg, or .png photos",
);
assert(!/WebP is fine/i.test(readme), "README should not allow WebP item photos");
assert(/notification/i.test(readme), "README should explain the Netlify form notification email");
assert(readme.includes("INDEXNOW_KEY"), "README should document the IndexNow key swap");
assert(/example-lamp\.md/.test(readme) && /delet/i.test(readme), "README should explain deleting the example items");
assert(readme.includes("npm run indexnow"), "README should document IndexNow");

const items = await readItems();
checkSource(items);

if (failures.length === 0) {
  await rm(path.join(root, "dist"), { recursive: true, force: true });
  build(true);
  await checkDraftBuild(items);
}

if (failures.length === 0) {
  await rm(path.join(root, "dist"), { recursive: true, force: true });
  await rm(path.join(root, "node_modules", ".astro"), { recursive: true, force: true });
  build(false);
  await checkProductionBuild();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log("Curbside checks passed.");

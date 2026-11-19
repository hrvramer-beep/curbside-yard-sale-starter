import { POLICIES, SITE_NAME } from "../../site.config.mjs";
import {
  absolutePhotoUrls,
  addMoney,
  entryText,
  flatShipping,
  gtinProperty,
  itemPath,
  schemaAvailability,
  schemaCondition,
  type ItemEntry,
} from "./catalog";

export function websiteJsonLd(site: URL) {
  const url = new URL("/", site).href;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    description: POLICIES.siteDescription,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url,
    },
  };
}

export async function productJsonLd(entry: ItemEntry, site: URL) {
  const photos = await absolutePhotoUrls(entry, site);
  const url = new URL(itemPath(entry.id), site).href;
  const description = entryText(entry);
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    price: entry.data.price.toFixed(2),
    priceCurrency: "USD",
    availability: schemaAvailability(entry.data.status),
    itemCondition: schemaCondition[entry.data.condition],
    url,
    seller: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    hasMerchantReturnPolicy: returnPolicy(),
  };

  const shipping = flatShipping(entry);
  if (typeof shipping === "number") {
    offer.shippingDetails = {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: shipping.toFixed(2),
        currency: "USD",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "US",
      },
    };
  }

  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: entry.data.title,
    description,
    image: photos.map((photo) => photo.src),
    sku: entry.id,
    category: entry.data.category,
    brand: {
      "@type": "Brand",
      name: entry.data.brand,
    },
    itemCondition: schemaCondition[entry.data.condition],
    offers: offer,
    hasMerchantReturnPolicy: returnPolicy(),
  };

  if (entry.data.mpn) product.mpn = entry.data.mpn;
  if (entry.data.gtin) product[gtinProperty(entry.data.gtin)] = entry.data.gtin;
  if (entry.data.weight) {
    product.weight = {
      "@type": "QuantitativeValue",
      value: entry.data.weight,
      unitCode: "LBR",
    };
  }

  return product;
}

function returnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "US",
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnDays: 0,
  };
}

export function shippedPrice(entry: ItemEntry): number {
  if (typeof entry.data.shippedPrice === "number") return entry.data.shippedPrice;
  return addMoney(entry.data.price, flatShipping(entry));
}

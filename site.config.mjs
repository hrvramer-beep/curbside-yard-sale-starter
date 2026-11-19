/**
 * Curbside Starter settings.
 *
 * This is the only file that sets the store name, the town or area, the
 * pickup spot, the contact-form wording, the shipping, pickup, returns,
 * and payment text, and the public site address.
 * Every page reads these values from here.
 *
 * SITE_URL is read from the environment at build time when it is set.
 * The default below is a placeholder until you set the real address.
 *
 * INDEXNOW_KEY is a placeholder. Replace it with your own IndexNow key
 * before you ping IndexNow. The key is public: the build publishes it at
 * /<INDEXNOW_KEY>.txt. There is no separate key file to commit.
 */

export const SITE_NAME = "Curbside";

export const SITE_TAGLINE = "A yard-sale shelf for one household's unwanted things.";

export const SITE_URL_DEFAULT = "https://example.com";

/** Value shipped in the starter. Replace INDEXNOW_KEY before pinging IndexNow. */
export const INDEXNOW_KEY_PLACEHOLDER = "replace-me-indexnow-key";

/** Public IndexNow key. Replace this placeholder before pinging IndexNow. */
export const INDEXNOW_KEY = INDEXNOW_KEY_PLACEHOLDER;

/** Public path to a logo file in public/, or "" for the built-in text mark. */
export const LOGO_SRC = "";

/** Town or area buyers see on the site. */
export const PICKUP_AREA = "the local area";

/** Where a buyer meets you. Keep this a public place, never a home address. */
export const PICKUP_SPOT = "a public spot you both agree on";

/**
 * Text shoppers read on the About page and on listing pages.
 * Write finished sentences. These words are printed on the site.
 */
export const POLICIES = {
  aboutDescription: `How ${SITE_NAME} ships, handles local pickup in ${PICKUP_AREA}, treats returns, and takes card payment through Stripe.`,
  aboutIntro: `${SITE_NAME} lists one household's personal unwanted items. It is a yard sale on the web, in ${PICKUP_AREA}. It is not a shop for any business.`,
  shipping: [
    "Items ship to addresses in the United States. The shipping price is on the listing, and the shipped total adds that price to the item price.",
    "The seller packs each item at home. Timing depends on the carrier and on when the listing sells. There is no warehouse and no same-day promise.",
  ],
  pickup: [
    `Some listings offer pickup in ${PICKUP_AREA}. Pickup is at ${PICKUP_SPOT}. The site does not publish a home address.`,
    "Use the form on the item page to ask about pickup. If a listing says it ships only, pickup is not offered.",
  ],
  returns: ["Items are used personal goods sold as-is. All sales are final."],
  payment: [
    `Payment is by card through Stripe only. The Buy button opens a Stripe Payment Link in this same tab. ${SITE_NAME} does not run its own card form and does not see your card number.`,
    "If a listing has no payment link, or it is pending or sold, there is no Buy button. The offer form is only on available listings.",
  ],
  shipsOnly: "This listing ships only. Local pickup is not offered.",
  siteDescription: `${SITE_NAME} is an online yard sale of personal unwanted items. Shipping is listed per item. Local pickup is in ${PICKUP_AREA}, meeting at ${PICKUP_SPOT}.`,
  llmsIntro: `${SITE_NAME} is an online yard sale of personal unwanted items. Payment is by card through Stripe Payment Links only. Local pickup, when a listing offers it, is in ${PICKUP_AREA} at ${PICKUP_SPOT}. Sold items stay on their own pages and are out of stock.`,
  llmsFullIntro: `${SITE_NAME} sells personal unwanted items. Each available item is listed below with its description, price, shipping, and URL. Payment is by card through the Stripe checkout URL when one is set. Pickup, when offered, is in ${PICKUP_AREA} at ${PICKUP_SPOT}. Sold and draft listings are omitted here.`,
};

/** Pickup sentence on an item page. `area` is the item town, or PICKUP_AREA. */
export function pickupAvailableNote(area = PICKUP_AREA) {
  return `Local pickup is available in ${area}, at ${PICKUP_SPOT}. The seller does not publish a home address.`;
}

/** Wording for the Netlify offer form and the contact page. */
export const CONTACT_FORM = {
  formName: "curbside-message",
  contactHeading: "Send a message",
  contactIntro:
    "Name, email, and a message are required. Add an offer amount only if you are talking about a price.",
  contactPageIntro:
    "Questions that are not about one listing can go through this form. For a specific item, the form on that item's page already includes the item name.",
  itemHeading: "Ask a question or make an offer",
  itemIntro:
    "Send a note about this item. An offer amount is optional. The listed price is what the Buy button charges.",
  nameLabel: "Name",
  emailLabel: "Email",
  offerLabel: "Offer amount in USD (optional)",
  messageLabel: "Message",
  submitLabel: "Send message",
  botLabel: "Leave this field empty",
};

export function getSiteUrl() {
  const raw = (process.env.SITE_URL?.trim() || SITE_URL_DEFAULT).replace(/\/+$/, "");
  return raw;
}

export function isPlaceholderSiteUrl(url = getSiteUrl()) {
  try {
    return new URL(url).hostname === "example.com";
  } catch {
    return true;
  }
}

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);

function isStripePaymentLink(value: string): boolean {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "buy.stripe.com" && url.pathname.length > 1;
  } catch {
    return false;
  }
}

function photoExtension(value: string): string {
  const clean = value.split(/[?#]/)[0];
  const match = clean.match(/\.([A-Za-z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function photoTypeMessage(value: string): string {
  const ext = photoExtension(value);
  const shown = ext ? `.${ext}` : "missing an extension";
  return `Item photos must be .jpg, .jpeg, or .png (this file is ${shown}). SVG and other formats are not supported.`;
}

function optionalBlank(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
}

/** Keep product codes as text, including leading zeros and long digit strings. */
function preserveCode(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value)) {
    return value.toFixed(0);
  }
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

const optionalCode = z.preprocess(preserveCode, z.string().min(1).optional());

const optionalText = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}, z.string().min(1).optional());

const optionalNumber = z.preprocess(optionalBlank, z.number().optional());

const optionalQuantity = z.preprocess(optionalBlank, z.number().int().min(1).optional());

function stripeField(name: string) {
  return z.string().refine(isStripePaymentLink, `${name} must be an https://buy.stripe.com/ URL`);
}

const items = defineCollection({
  loader: glob({ base: "./src/content/items", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      price: z.number().min(0),
      shippingPrice: z.number().min(0),
      condition: z.enum(["new", "like-new", "good", "fair", "for-parts"]),
      localPickup: z.boolean(),
      photos: z
        .array(
          z.object({
            src: z
              .string()
              .superRefine((value, ctx) => {
                if (!PHOTO_EXTENSIONS.has(photoExtension(value))) {
                  ctx.addIssue({
                    code: "custom",
                    message: photoTypeMessage(value),
                    fatal: true,
                  });
                }
              })
              .pipe(image()),
            alt: z.string().trim().min(20),
          }),
        )
        .min(1)
        .max(12),
      status: z.enum(["available", "pending", "sold"]),
      paymentLink: z.preprocess((value) => {
        if (value === undefined || value === null) return "";
        return String(value).trim();
      }, stripeField("paymentLink")),
      pairPaymentLink: z.preprocess((value) => {
        if (value === undefined || value === null) return undefined;
        const text = String(value).trim();
        return text === "" ? undefined : text;
      }, stripeField("pairPaymentLink").optional()),
      quantity: optionalQuantity,
      pairPrice: optionalNumber,
      shipping: optionalNumber,
      shippedPrice: optionalNumber,
      pairShippedPrice: optionalNumber,
      category: z.string().min(1),
      brand: z.string().min(1),
      mpn: optionalCode,
      gtin: optionalCode,
      conditionNote: optionalText,
      pickupArea: optionalText,
      weight: z.preprocess(optionalBlank, z.number().positive().optional()),
      googleProductCategory: z.preprocess(optionalBlank, z.string().min(1).optional()),
      listedAt: z.coerce.date(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { items };

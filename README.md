# Curbside Starter

Curbside Starter is a ready-made website for a household yard sale. People can look at what you are selling, pay by card, or send you a question. You add each item as a short text file and a photo. The site is a simple set of pages, so it is fast and easy to host.

Two fake listings are included so the site has something to show the first time it is built. They are drawings, not real products. Delete them when you add your own things. See [The example items](#the-example-items).

## Put it on the web with Netlify

1. On GitHub, open this repository and click **Use this template**, then **Create a new repository**. That gives you your own copy. Leave the copy public or private, whichever you prefer.
2. Log in to Netlify. Choose **Add new project**, then **Import an existing project**. Connect GitHub if it asks, and pick the new repository.
3. Netlify reads `netlify.toml` for you. Check that the build command is `npm run build` and the publish directory is `dist`. The Node.js version is already set to 22 in that file.
4. Start the deploy. When it finishes, Netlify gives you a web address. Open it and you should see the two example listings.

If GitHub does not show **Use this template**, the repository owner still needs to turn on **Template repository** in the GitHub settings for this repo. This project does not change that setting for you.

## Change the name, the town, and the pickup spot

Open `site.config.mjs`. That one file is where the public wording lives. Change these and leave the rest of the site alone:

- `SITE_NAME` is the store name in the header, the footer, and the page titles.
- `PICKUP_AREA` is the town or area.
- `PICKUP_SPOT` is where you meet a buyer. Keep it a public place. Do not put a home address here.
- `CONTACT_FORM` is the heading, the short note, the field labels, and the button on the question form.
- `POLICIES` is the About page text: the introduction, shipping, pickup, returns, and payment. The same file also holds the pickup sentence used on an item page.
- `SITE_URL_DEFAULT` is the stand-in web address used until you set the real one.

`PICKUP_AREA` starts as "the local area" and `PICKUP_SPOT` starts as "a public spot you both agree on". Change both to the real place before you share the site.

## Shipping, pickup, and returns

Shoppers read this on the About page. It also feeds the short pickup note on each item. All of it lives in `POLICIES` inside `site.config.mjs`:

- `aboutIntro` is the first paragraph on the About page.
- `shipping` is the list of shipping paragraphs.
- `pickup` is the list of local-pickup paragraphs.
- `returns` is the list of returns paragraphs. The default says used goods are sold as-is and all sales are final.
- `payment` is the list of payment paragraphs.
- `shipsOnly` is the note on an item that does not offer pickup.

Write those as finished sentences a buyer can read. Do not leave notes to yourself in them. Anything you type there is printed on the public site. There is no separate "edit me" line.

## Set the site address (`SITE_URL`)

Links, the sitemap, and the product feeds need the real address of the site, starting with `https://` and with no slash at the end.

In Netlify, open **Site configuration**, then **Environment variables**, and add one named `SITE_URL`. Set the value to your site address. Netlify will use it the next time the site builds.

If you do not set `SITE_URL`, the site uses `https://example.com` from `SITE_URL_DEFAULT` in `site.config.mjs`. You can change that default too, but the Netlify variable is the one to use once the site is live.

## Tell Netlify where to send form messages

The contact page and each available item have a form named `curbside-message`. Netlify stores the messages. The site itself does not contain an email address.

After the first deploy:

1. In Netlify, open the site.
2. Make sure form detection is on. It is in the **Forms** section for the site.
3. Open **Project configuration**, then **Notifications**.
4. Add an email notification for form submissions, and type the email address where you want those messages.

The wording of the form is in `CONTACT_FORM` inside `site.config.mjs`.

## Swap the IndexNow key (`INDEXNOW_KEY`)

IndexNow is an optional way to tell Bing and other search tools that a page changed. The site does not ship a real key.

`INDEXNOW_KEY` in `site.config.mjs` is a placeholder (`replace-me-indexnow-key`). The build writes a public text file at that name, for example `/replace-me-indexnow-key.txt`. There is no separate key file in the project to replace. You swap the value of `INDEXNOW_KEY`.

1. Invent a new key of your own: a long string of letters and numbers, with no spaces. IndexNow keys are public.
2. Put that string in `INDEXNOW_KEY` in `site.config.mjs`, in place of `replace-me-indexnow-key`.
3. Deploy again so the live site serves a text file whose name and contents are your new key.

When `SITE_URL` is the real address, you can ping IndexNow from a computer that has this project by running:

```bash
npm run indexnow
```

That command does nothing, and tells you why, while `INDEXNOW_KEY` is still `replace-me-indexnow-key` or while `SITE_URL` is still the example address. You do not have to use IndexNow for the yard sale to work.

## The example items

`example-lamp.md` and `example-chair.md` are fake. The lamp is marked available and has no payment link, so there is no Buy button. The chair is marked sold. Their photos are simple drawings made for this template.

Delete all of these when you are ready to list real things:

- `src/content/items/example-lamp.md`
- `src/content/items/example-chair.md`
- the folder `src/assets/items/example-lamp/`
- the folder `src/assets/items/example-chair/`

The site still builds if those are the only listings you remove and you have not added your own yet. The home page will say nothing is listed.

## Adding an item

Each item is one Markdown file in `src/content/items/`, plus one or more photos.

1. Pick a short name made of lowercase letters, numbers, and hyphens. That name is the link. Example: `blue-lamp` becomes a page at `/items/blue-lamp`.
2. Create a folder `src/assets/items/blue-lamp/`.
3. Put the photos in that folder. Use `.jpg`, `.jpeg`, or `.png` only. SVG files are rejected, and so is any other format. A phone photo saved as JPEG is the usual choice.
4. Create `src/content/items/blue-lamp.md`. Copy the block below and change the values. A blank copy also lives in `templates/item.md`.
5. Set `draft: false` when the item should show on the live site. `draft: true` hides it from the normal build.
6. Commit the file and the photos, and let Netlify build again.

Photo `alt` text is a full sentence about what is in that photo. It must be at least 20 characters. "Photo" or "placeholder" is not enough.

```yaml
---
title: Blue ceramic lamp          # Name shoppers see
price: 18                         # Item price in dollars, no dollar sign
shippingPrice: 8                  # Usual US shipping price in dollars
condition: good                   # new, like-new, good, fair, or for-parts
localPickup: true                 # true or false, no quotes
photos:
  - src: ../../assets/items/blue-lamp/front.jpg
    alt: A blue ceramic table lamp with a white shade sitting on a wooden table
  - src: ../../assets/items/blue-lamp/base.jpg
    alt: The round ceramic base of the lamp, with a small chip on the back edge
status: available                 # available, pending, or sold
paymentLink: ""                   # Stripe link for one, or empty quotes
pairPaymentLink: ""               # Stripe link for a pair, or empty quotes
quantity: 1                       # Optional. Whole number, 1 or more
pairPrice:                        # Optional. Price for both, no dollar sign
shipping:                         # Optional. Replaces shippingPrice when set
shippedPrice:                     # Optional. Exact shipped total for one
pairShippedPrice:                 # Optional. Exact shipped total for both
category: Household               # Short shelf name, such as Furniture
brand: Unbranded                  # Required. Use Unbranded when there is no brand
mpn: ""                           # Optional product code. Keep the quotes
gtin: ""                          # Optional barcode number. Keep the quotes
conditionNote: ""                 # Optional extra note, such as a scratch
pickupArea: ""                    # Optional. Overrides the town for this item only
weight: 3                         # Optional weight in pounds
googleProductCategory: ""         # Optional Google product category
listedAt: 2026-11-17              # Date you listed it, year-month-day
draft: true                       # true hides it. false publishes it
---

Write a few plain sentences. Say what the item is, what is included, and any flaw a buyer should know.
```

Quote `mpn` and `gtin` so a long number or a leading zero is not cut off. Leave an optional line empty, or delete it, when you are not using it.

## Stripe Payment Links

The site does not take card numbers. Stripe does. You create a Payment Link in Stripe, then paste that address into the item file. While `paymentLink` is empty quotes, an available item has no Buy button.

One item:

1. Create a Stripe account at [https://stripe.com](https://stripe.com) if you do not have one.
2. In the Stripe Dashboard, open **Payment Links**, then create a new link.
3. Name it after the item. Set the price to the amount the buyer should pay. If you want one charge that already includes shipping, use the shipped total as that price.
4. Create the link. Stripe shows an address that starts with `https://buy.stripe.com/`.
5. Copy the whole address into `paymentLink` in the item file, between the quotes.

A pair, when you will sell two together at a second price:

1. Create a second Payment Link for the pair price.
2. Paste that address into `pairPaymentLink`.
3. You can also set `pairPrice` so the page shows the pair price, and `pairShippedPrice` so the second button shows the shipped total.

Leave either field as `""` when you do not have that link. Do not invent an address. An empty link is valid. Anything that is filled in must be a real `https://buy.stripe.com/` address or the build stops.

## How to mark an item sold

Open the item's Markdown file. Change this line:

```yaml
status: available
```

to:

```yaml
status: sold
```

Keep the file. Do not delete it. The page stays up so old links still open. It shows Sold, hides the Buy button and the question form, and the product feeds report it out of stock.

`status: pending` means the item is on hold. The Buy button and the form stay hidden, and the feeds treat it as out of stock.

## What the build publishes

Besides the pages, the build writes:

- a sitemap
- `robots.txt`
- a JSON product feed at `/feeds/products.json`
- an RSS product feed for Google at `/feeds/google-merchant.xml`
- short text catalogs at `/llms.txt` and `/llms-full.txt`
- the IndexNow key file named from `INDEXNOW_KEY`

Each item page includes structured data for the product, including shipping, and `gtin` or `mpn` when you filled those in.

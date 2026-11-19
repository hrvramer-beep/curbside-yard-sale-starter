---
title: Name of the item
price: 20
shippingPrice: 8
condition: good
localPickup: true
photos:
  - src: ../../assets/items/your-slug/front.jpg
    alt: Describe what a person sees in this photo, in one full sentence.
  - src: ../../assets/items/your-slug/back.jpg
    alt: Describe the second photo in one full sentence too.
status: available
paymentLink: ""
pairPaymentLink: ""
quantity:
pairPrice:
shipping:
shippedPrice:
pairShippedPrice:
category: Household
brand: Unbranded
mpn: ""
gtin: ""
conditionNote: ""
pickupArea: ""
weight: 2
googleProductCategory: ""
listedAt: 2026-11-17
draft: true
---

Write the description here in plain sentences. Say what the item is, what is included, and any flaw a buyer should know.

Field rules, for the person filling this in:

- The filename is the slug. Use lowercase letters, numbers, and hyphens, then .md. Example: src/content/items/blue-lamp.md.
- Photo paths are relative to src/content/items/. Put files in src/assets/items/<slug>/.
- Photos must be .jpg, .jpeg, or .png. SVG, WebP, and other formats fail the check and the build.
- Each alt must describe that photo in a full sentence. Alt text shorter than 20 characters is rejected.
- condition must be one of: new, like-new, good, fair, for-parts.
- status must be one of: available, pending, sold.
- localPickup and draft are true or false, with no quotes.
- price and shippingPrice are numbers in US dollars, with no dollar sign.
- paymentLink and pairPaymentLink are Stripe Payment Links (https://buy.stripe.com/...) or empty quotes.
- quantity is an optional whole number, 1 or more. pairPrice, shipping, shippedPrice, and pairShippedPrice are optional numbers. conditionNote and pickupArea are optional text. Delete the line or leave it empty.
- mpn and gtin are optional product codes. Quote them so every digit is kept, including leading zeros. weight and googleProductCategory are optional too. Delete the line or leave it empty.
- listedAt is a date, YYYY-MM-DD.
- This file starts as draft: true so it stays off the production site. Set draft: false when it should go live.
- Set status: sold to mark the item sold. Keep the file. The page stays up, shows Sold, hides Buy, and the feeds report it out of stock.

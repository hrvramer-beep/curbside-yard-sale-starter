---
name: set-up-a-curbside-online-yard-sale-from-scratch
description: "Use this when a new owner (often not technical) wants their own online yard sale bot and store set up: a storefront website, offer inbox, payment links, search and AI visibility, shipping and a daily check. Covers what the bot does itself and the few steps only the owner can do."
---
# Set up a Curbside online yard sale from scratch

Goal: the owner ends up with their own yard sale bot, a free public storefront website, offers landing in the bot's inbox, buyers paying through payment links, and a daily routine that answers buyers and runs marketing. The owner should only have to do the steps that need their identity, money or passkeys. The bot does everything else and explains each owner step in one or two plain sentences.

## How to talk to a non-technical owner
- Use one step at a time and say how long it takes. Most steps take 2 to 5 minutes.
- Never ask them to open a terminal or edit code. Use choice cards for decisions and the screen handoff for sign-ins.
- Tell them up front what's free and what costs money. The whole setup is free. The only ongoing costs are shipping labels, which buyers already paid for, and the payment provider's fee on each sale.

## Phase 0: Gather the basics (about 5 minutes, owner answers)
Ask only these, using a choice card or a short sentence for each:
1. The store's name and town. The town is used for local pickup copy.
2. Whether they already have a GitHub account. If they don't, help them create one. Signing in with Google is fine.
3. Where payouts should go: a bank account, or an X Money account with routing and account numbers.
4. Whether the store should carry their business name. The default is a neutral, personal store with no business branding.
5. Their rules:
   - whether to approve every listing (default yes, until they say otherwise)
   - whether to see every offer, set floor prices, or hand everything over until it's time to ship
   - the public meeting spot for local pickup

Save the answers to memory. Never put their home address, phone or personal email on the site.

## Phase 1: The bot's own email inbox (about 1 minute, owner taps approve)
- Turn on the bot's own email address. Offers and form notifications go there, so the owner's personal email never shows up publicly.
- Some services, Netlify among them, reject bot inbox domains for sign-up. Sign up for those with GitHub instead.

## Phase 2: The storefront code (bot or an engineering helper, owner does nothing)
The store is a static website with one simple text file per item.

**Fastest path:** use the public Curbside starter, [curbside-yard-sale-starter](https://github.com/hrvramer-beep/curbside-yard-sale-starter), which is MIT licensed. In the browser, signed in as the owner, click GitHub's "Use this template" button to copy it into their account. Then edit just `site.config.mjs` to set the store name, the town, the site URL and a fresh `INDEXNOW_KEY`. The README covers each setting in plain English.

**Otherwise:** have a coding helper build it to this spec:
- An Astro static site, with one markdown file per item in `src/content/items/<slug>.md`.
- Frontmatter for each item:
  - title
  - price
  - shipping price
  - condition
  - local pickup (yes or no)
  - photos with alt text
  - status: `available`, `pending` or `sold`
  - `paymentLink`, blank until the link is made
  - `draft: true` until the owner approves the item
- A page for each item with photos, price, condition, the shipping-included price and the local pickup option.
- schema.org Product and Offer JSON-LD on every item page.
- A generated sitemap.
- A `robots.txt` that welcomes search and AI crawlers: Googlebot, Bingbot, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and others.
- `llms.txt`, a plain-text summary of the store and its items for AI tools.
- A Google Merchant Center product feed, and a JSON product feed that AI shopping agents can read.
- An offer form named `curbside-message`, using Netlify Forms.
- A Buy button that opens the payment link, shown only when `paymentLink` is set and the status is `available`.
- The site URL read from a `SITE_URL` environment variable.

The store must not link to or share data with the owner's other business apps unless they ask.

## Phase 3: Hosting on Netlify (about 10 minutes, owner may need to sign in once)
Follow the `deploy-a-github-repo-to-netlify-from-the-box` skill (Deploy a GitHub repo to Netlify from the box):
- Sign up with GitHub, and give Netlify access to the store repo only.
- Set the build command to `npm run build` and the publish directory to `dist`. Set `SITE_URL` to the netlify.app address.
- Turn on form detection. Add an email notification for `curbside-message` that goes to the bot's inbox, then open the confirmation link in the browser.
- Visitor access may default to Private. Ask whether to make the site public now or at the first listing. Going public early is safe because draft items never show. Confirm that `/` returns 200.
- If the owner signs in to GitHub with Google, hand them the screen. If Netlify then shows "Invalid state key", retry Sign up with GitHub.

## Phase 4: Getting paid (about 15 minutes, owner only)
The bot can't open a payment account for someone, because that needs their legal identity and bank details. Walk them through it:
1. Create a Stripe account in their own name, and verify their identity. An individual or sole proprietor account is fine for a yard sale.
2. Add the payout bank account. For X Money, use its routing and account numbers.
3. Connect the Stripe connector so the bot can make payment links itself. For each item, the bot follows the `create-stripe-payment-links-for-a-yard-sale-item` skill (Create Stripe Payment Links for a yard sale item): one link per variant at the shipping-included price, capped at the units available, and deactivated when it sells out.
4. Make the first sale a small one, to prove the payouts arrive.

The bot never moves money, never refunds or cancels without the owner's yes, and never takes payment any other way.

## Phase 5: Shipping (about 3 minutes, owner only)
- The owner adds a card to the vault for shipping labels. The bot buys a label only after an order is paid, only when it costs no more than the shipping the buyer paid, and only after the owner taps Pay on the order card.
- Use a label service such as Pirate Ship, which charges only for postage.
- For each order, send the owner the label PDF, the box to use and where to drop it off. Send the buyer the tracking number.

## Phase 6: Visibility and marketing (bot, owner approves new channels)
1. Search and AI visibility come first.
   - Replace the starter's placeholder `INDEXNOW_KEY` with a fresh random 32-character hex key.
   - After each item goes live, ping IndexNow, which covers Bing and the AI search tools that use Bing.
2. Set up Google Merchant Center free listings. The owner creates the account, which takes about 10 minutes. The bot adds the product feed and fixes any warnings. There are no ads and no cost.
3. Give every image descriptive alt text, and give every listing a Q&A section that AI answer engines can quote.
4. Use only free channels the owner approves, such as social posts, Marketplace or Craigslist cross-posts, and local groups. Track which channel brings each buyer. Never pay for ads, boosts or fees without asking.

## Phase 7: The daily routine (bot, owner does nothing)
Create a daily morning routine that:
- answers buyer questions
- handles offers according to the owner's rules
- handles labels or pickup plans for paid orders
- deactivates links that could oversell
- does one round of free marketing
- stays quiet when nothing happened

## Phase 8: First listing (about 2 minutes per item, owner sends a photo)
1. Identify the item and ask the owner only what the photo can't show.
2. Research real sold prices and cite them. Propose a list price and the lowest acceptable price.
3. Write an honest listing that names every flaw, with real carrier rates, the shipping-included price and free local pickup.
4. Publish after the owner's yes, or under their standing OK:
   - Set `draft: false` and add the payment link.
   - Photos must be JPEG or PNG, because SVG breaks the Astro build. The GitHub connector can't push binary files, so upload photos through GitHub's web "Upload files" page, then commit the markdown.
   - Check that the Netlify deploy succeeded and that the item page returns 200. Item URLs may need a trailing slash.
   - Then ping IndexNow.

## Checklist to send the owner at the end
- The store's address, and a check that it opens publicly.
- The offer inbox, with a test form message that arrived.
- Whether payouts are connected, and whether a first payout has been proven.
- Whether a shipping-label card is in the vault.
- The daily routine and its time.
- What's left for them, one line each.

## Never
- Move money, refund or cancel without the owner's yes, or pay for ads or fees.
- Share the owner's home address, phone or personal email.
- Misrepresent condition. Invent sold prices, reviews or competing offers. Sell illegal, recalled or restricted items.
- Post anything public in the owner's name without their OK.

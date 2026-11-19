---
name: create-stripe-payment-links-for-a-yard-sale-item
description: "Use this when an approved item listing needs a Stripe Payment Link (shipped price, US shipping address, limited quantity) made through the Stripe connector rather than by the owner in the dashboard."
---
# Create Stripe Payment Links for a yard sale item

1. If the Stripe connector isn't installed, install the Stripe plugin and let the owner connect their account. Then call `list_available_accounts_or_orgs` to get the `stripe_context` and confirm `livemode: true`. Never use test mode for real listings.
2. For each price variant (for example, one item shipped, or a pair shipped), call `stripe_api_write` with `PostProducts`. Set:
   - `name`
   - a short honest `description`
   - `default_price_data: {currency: "usd", unit_amount: <cents>}`
   - `metadata: {slug, variant}`
3. For each product's `default_price`, call `stripe_api_write` with `PostPaymentLinks`. Set:
   - `line_items: [{price, quantity: 1}]`
   - `shipping_address_collection: {allowed_countries: ["US"]}`
   - `restrictions: {completed_sessions: {limit: <units available for that variant>}}`, so a link can't sell more than exists
   - `after_completion` with a hosted confirmation message saying tracking will come by email
   - `metadata: {slug, variant}`
4. Save the link ids and URLs to memory and give the URLs to whoever maintains the storefront for the Buy buttons.
5. When units sell, deactivate any link that could now oversell. Use `PostPaymentLinksPaymentLink` with `active: false`.

The amounts sent to Stripe are in cents, so $39 is `3900`. Never move money, refund, or cancel through this connector without the owner's explicit yes.

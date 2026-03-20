# Payment & Delivery System

## Stripe Integration

### Option 1: Stripe Checkout (Easiest)

Create payment links in Stripe Dashboard:
1. Go to https://dashboard.stripe.com/products
2. Create products for each template
3. Get payment links
4. Share links with customers

### Option 2: Stripe API (More Control)

```javascript
// server.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Bot Template' },
        unit_amount: 299900, // $2,999.00
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: 'https://yoursite.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://yoursite.com/cancel',
  });
  
  res.json({ url: session.url });
});
```

---

## Invoice System

### Process

1. **Customer contacts you** — Discord DM, email
2. **You send invoice** — Custom invoice
3. **They pay** — Stripe/link
4. **You deliver** — Git repo + setup call

### Invoice Template

```
INVOICE #001
Date: 2026-03-20

TO: [Customer Name]
Email: [Customer Email]

ITEM: MEV Bot Template
PRICE: $2,999.00

PAYMENT: Stripe [link]

DELIVERY: Within 24 hours of payment

---
Thank you!
```

---

## Delivery Process

### After Payment

1. **Get GitHub repo ready** — Make private repo with template
2. **Add customer as collaborator** — Or send zip file
3. **Schedule setup call** — 30 min zoom
4. **Send welcome email** — With repo link + call details

### Email Template

```
Subject: Your MEV Bot Template - Ready!

Hi [Name],

Thank you for your purchase!

Here's your template: [GitHub Link]

Let's schedule your setup call: [Calendly Link]

Any questions? Just reply to this email.

Best,
[Your Name]
```

---

## Files to Create

1. `STRIPE_SETUP.md` — How to set up Stripe
2. `INVOICE_TEMPLATE.md` — Invoice format
3. `DELIVERY_PROCESS.md` — Delivery steps

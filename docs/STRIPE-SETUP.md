# Stripe Setup Guide

## Step 1: Create Stripe Account

1. Go to **https://stripe.com**
2. Click **"Start now"**
3. Sign up with email or Google/GitHub account
4. Complete account setup (name, business info)

---

## Step 2: Create Products

### Option A: Quick (Payment Links) — Recommended

1. Go to **Products** → **Add product**
2. Create each product:

| Product Name | Price | Description |
|-------------|-------|-------------|
| Bot Template | $2,999 | MEV arbitrage bot |
| Docker Suite | $1,499 | Deployment templates |
| Dashboard SaaS | $499 | Streamlit dashboard |
| REST API | $299 | Express trading API |
| Full Package | $3,999 | Everything |

3. For each product:
   - Click **"Create product"**
   - Fill in name & price
   - Click **"Save product"**
4. Then click **"Create payment link"** for each
5. Copy the payment link

---

### Option B: API (More Control)

If you want custom checkout:

1. Go to **Developers** → **API keys**
2. Copy your **Publishable key** and **Secret key**
3. Add to your code:

```javascript
const stripe = require('stripe')('sk_test_...');

const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: 'Bot Template' },
      unit_amount: 299900,
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: 'https://yoursite.com/success',
  cancel_url: 'https://yoursite.com/cancel',
});
```

---

## Step 3: Get Payment Links (Easiest)

1. Go to **Products**
2. Click your product
3. Click **"Create payment link"**
4. Copy the link
5. Replace in docs/INVOICE_TEMPLATE.md

---

## Step 4: Test It

1. Open your payment link in incognito
2. Use test card: **4242 4242 4242 4242**
3. Verify it works

---

## After Setup

Once you have Stripe:
1. Update docs with your payment links
2. Start selling!

---

## Need Help?

Stripe has great docs: https://stripe.com/docs

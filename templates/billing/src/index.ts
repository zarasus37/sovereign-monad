import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { ClientStore } from './client-store';
import { getBillingConfig, ApiTier, BillingInterval } from './config';
import { InquiryStore, InquiryKind } from './inquiry-store';
import { createStripeClient, getPriceIdForTier } from './stripe';
import { handleStripeEvent } from './webhooks';

dotenv.config();

const app = express();
const config = getBillingConfig();
const store = new ClientStore(config.apiKeyStorePath);
const inquiryStore = new InquiryStore(config.inquiryStorePath);

app.use(cors());
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    inquiryCount: inquiryStore.count(),
  });
});

app.post('/checkout/session', async (req: Request, res: Response) => {
  try {
    const {
      tier,
      billingInterval,
      clientName,
      email,
      organization,
      aumRange,
      successUrl,
      cancelUrl,
    } = req.body as {
      tier?: ApiTier;
      billingInterval?: BillingInterval;
      clientName?: string;
      email?: string;
      organization?: string;
      aumRange?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!tier || !clientName || !email) {
      return res.status(400).json({ error: 'tier, clientName, and email are required' });
    }

    const interval = billingInterval === 'annual' ? 'annual' : 'monthly';
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: getPriceIdForTier(tier, interval),
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: successUrl || config.checkoutSuccessUrl,
      cancel_url: cancelUrl || config.checkoutCancelUrl,
      metadata: {
        clientName,
        email,
        tier,
        billingInterval: interval,
        organization: organization || '',
        aumRange: aumRange || '',
      },
      subscription_data: {
        metadata: {
          clientName,
          email,
          tier,
          billingInterval: interval,
          organization: organization || '',
          aumRange: aumRange || '',
        },
      },
      allow_promotion_codes: true,
    });

    return res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'unable_to_create_checkout_session',
    });
  }
});

app.post('/portal/session', async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body as { customerId?: string; returnUrl?: string };

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const stripe = createStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || config.portalReturnUrl,
    });

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'unable_to_create_portal_session',
    });
  }
});

app.post('/sales/request', (req: Request, res: Response) => {
  try {
    const {
      kind,
      tier,
      billingInterval,
      clientName,
      email,
      organization,
      aumRange,
      note,
      priceLabel,
      sourcePage,
    } = req.body as {
      kind?: InquiryKind;
      tier?: ApiTier;
      billingInterval?: BillingInterval;
      clientName?: string;
      email?: string;
      organization?: string;
      aumRange?: string;
      note?: string;
      priceLabel?: string;
      sourcePage?: string;
    };

    if (!tier || !clientName || !email) {
      return res.status(400).json({ error: 'tier, clientName, and email are required' });
    }

    const record = inquiryStore.create({
      kind: kind || 'sales_request',
      tier,
      billingInterval: billingInterval === 'annual' ? 'annual' : 'monthly',
      clientName,
      email,
      organization,
      aumRange,
      note,
      priceLabel,
      sourcePage,
    });

    return res.json({
      accepted: true,
      inquiryId: record.inquiryId,
      createdAt: record.createdAt,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'unable_to_store_sales_request',
    });
  }
});

app.post('/webhooks/stripe', (req: Request, res: Response) => {
  try {
    const stripe = createStripeClient();
    const signature = req.headers['stripe-signature'];

    if (!signature || Array.isArray(signature)) {
      return res.status(400).send('Missing Stripe signature');
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.stripeWebhookSecret
    );

    handleStripeEvent(event, store);
    return res.json({ received: true });
  } catch (error) {
    return res.status(400).send(
      error instanceof Error ? error.message : 'Webhook signature verification failed'
    );
  }
});

app.get('/success', async (req: Request, res: Response) => {
  const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
  let customerEmail = '';
  let tier = '';

  if (sessionId) {
    try {
      const stripe = createStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      customerEmail = session.customer_details?.email || session.customer_email || '';
      tier = session.metadata?.tier || '';
    } catch {
      // Best effort only. The page should still render if Stripe is unreachable.
    }
  }

  return res
    .type('html')
    .send(
      renderPage({
        title: 'Checkout complete',
        body: `
          <h1>Checkout complete</h1>
          <p>Your subscription checkout has been received.</p>
          ${
            customerEmail
              ? `<p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>`
              : ''
          }
          ${tier ? `<p><strong>Tier:</strong> ${escapeHtml(tier)}</p>` : ''}
          <p>Your onboarding and API key follow after payment confirmation.</p>
          <p><a href="/account">Billing account</a></p>
        `,
      })
    );
});

app.get('/cancel', (_req: Request, res: Response) => {
  return res.type('html').send(
    renderPage({
      title: 'Checkout canceled',
      body: `
        <h1>Checkout canceled</h1>
        <p>No charge was created.</p>
        <p>You can return to the commercial page and restart checkout at any time.</p>
      `,
    })
  );
});

app.get('/account', (_req: Request, res: Response) => {
  return res.type('html').send(
    renderPage({
      title: 'Billing account',
      body: `
        <h1>Billing account</h1>
        <p>This endpoint is the return target for the Stripe customer portal.</p>
        <p>If you need a new portal session, call <code>POST /portal/session</code> with your Stripe customer id.</p>
      `,
    })
  );
});

app.listen(config.port, () => {
  console.log(`Billing service running on port ${config.port}`);
});

function renderPage(input: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#0b0d12; color:#e6e8ef; margin:0; }
    main { max-width:680px; margin:80px auto; padding:32px; background:#121621; border:1px solid #23283a; border-radius:16px; }
    h1 { margin-top:0; font-size:2rem; }
    p, li { line-height:1.6; color:#b7bfd6; }
    a { color:#76a7ff; }
    code { background:#0b0d12; padding:2px 6px; border-radius:6px; }
  </style>
</head>
<body>
  <main>${input.body}</main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

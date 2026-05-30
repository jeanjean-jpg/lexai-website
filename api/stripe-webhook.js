/**
 * api/stripe-webhook.js — Vercel Serverless Function
 *
 * Handles two Stripe payment flows:
 *
 * 1. SUBSCRIPTION (monthly €150, plink_1TcmcQAmTjv96v3ZcoQvGVz8)
 *    - checkout.session.completed (mode=subscription, amount=0 during trial)
 *      → Send 30-day trial key so the customer can use the app immediately
 *    - invoice.payment_succeeded (billing_reason=subscription_create|subscription_cycle)
 *      → Send fresh 35-day key on each successful billing cycle
 *
 * 2. ONE-TIME (lifetime €2000, future payment link)
 *    - checkout.session.completed (mode=payment)
 *      → Send LIFETIME key immediately
 *
 * Required env vars on Vercel (Settings → Environment Variables):
 *   STRIPE_SECRET_KEY      — Stripe Dashboard → Developers → API keys → Secret key
 *   STRIPE_WEBHOOK_SECRET  — Stripe Dashboard → Webhooks → endpoint → Signing secret
 *   RESEND_API_KEY         — resend.com → API Keys
 *   LEXAI_LICENSE_SECRET   — must match the Electron app's licenseManager.js HMAC_SECRET
 *   FROM_EMAIL             — optional, defaults to "LEX AI <noreply@lexai.ro>"
 *
 * Stripe webhook events to enable:
 *   checkout.session.completed
 *   invoice.payment_succeeded
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const { Resend } = require('resend');

// Disable Vercel's automatic body parsing — Stripe needs the raw buffer for signature verification
module.exports.config = { api: { bodyParser: false } };

const HMAC_SECRET =
  process.env.LEXAI_LICENSE_SECRET ||
  'lexai-license-v1-xK9mP2qR7nL4wJ8s-CHANGE-BEFORE-SHIP';

const FROM_EMAIL = process.env.FROM_EMAIL || 'LEX AI <noreply@lexai.ro>';
const DOWNLOAD_URL = 'https://lexai.ro/descarcare';

// ---------------------------------------------------------------------------
// License key generation — mirrors licenseManager.js in the Electron app
// ---------------------------------------------------------------------------
function generateKey(plan, expiry, nonce) {
  const payload = {
    plan: String(plan).toUpperCase(),
    expiry,
    nonce: nonce || crypto.randomBytes(8).toString('hex'),
    iat: Math.floor(Date.now() / 1000),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(data)
    .digest('hex')
    .slice(0, 32);
  return `${data}.${sig}`;
}

function expiryInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Email builder
// ---------------------------------------------------------------------------
function buildEmail(to, { planLabel, licenseKey, expiry, isRenewal }) {
  const isLifetime = expiry === 'LIFETIME';
  const isTrial = !isLifetime && !isRenewal;

  let expirySection;
  if (isLifetime) {
    expirySection = `
      <div style="background:#1A3A2A;border:1px solid #2A5A3A;border-radius:8px;padding:12px 16px;margin:0 0 20px;font-size:13px;color:#4A9B7F;">
        ✓ Această licență nu expiră niciodată.
      </div>`;
  } else if (isTrial) {
    expirySection = `
      <div style="background:#1A2332;border:1px solid #2A3A4A;border-radius:8px;padding:12px 16px;margin:0 0 20px;font-size:13px;color:#8A99A8;line-height:1.6;">
        Cheia acoperă perioada de trial (30 de zile). Vei primi automat o cheie de reînnoire după prima plată.
      </div>`;
  } else {
    expirySection = `
      <div style="background:#1A2332;border:1px solid #2A3A4A;border-radius:8px;padding:12px 16px;margin:0 0 20px;font-size:13px;color:#8A99A8;line-height:1.6;">
        Cheia este valabilă 35 de zile (până pe <b style="color:#F0F0F0;">${expiry}</b>). Vei primi automat o cheie nouă la fiecare reînnoire lunară.
      </div>`;
  }

  const subject = isRenewal
    ? `Reînnoire licență LEX AI — ${planLabel}`
    : `Cheia ta de licență LEX AI — ${planLabel}`;

  const greeting = isRenewal
    ? 'Plata lunară a fost procesată cu succes. Iată cheia ta de licență reînnoită:'
    : `Mulțumim pentru achiziție! Mai jos găsești cheia de licență pentru planul <b style="color:#C9A84C;">${planLabel}</b>.`;

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:40px 20px;background:#0F1419;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#F0F0F0;">
  <div style="max-width:560px;margin:0 auto;background:#131B23;border:1px solid #2A3A4A;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="padding:28px 32px 22px;border-bottom:1px solid #2A3A4A;text-align:center;">
      <div style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:6px;color:#C9A84C;">LEX·AI</div>
      <div style="font-size:12px;color:#8A99A8;margin-top:6px;letter-spacing:0.05em;">${planLabel.toUpperCase()}</div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 18px;font-size:14px;color:#8A99A8;line-height:1.65;">${greeting}</p>

      <!-- Key box -->
      <div style="background:#0F1419;border:1px solid rgba(201,168,76,0.25);border-radius:8px;padding:18px 20px;margin:0 0 14px;">
        <div style="font-family:monospace;font-size:10px;letter-spacing:0.12em;color:#5C6A78;margin-bottom:10px;text-transform:uppercase;">Cheie de licență</div>
        <div style="font-family:monospace;font-size:11.5px;color:#C9A84C;word-break:break-all;line-height:1.7;">${licenseKey}</div>
      </div>

      ${expirySection}

      <!-- Activation steps -->
      <div style="background:#1A2332;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;color:#5C6A78;text-transform:uppercase;margin-bottom:12px;">Cum activezi</div>
        <ol style="margin:0;padding-left:18px;color:#8A99A8;font-size:13.5px;line-height:1.9;">
          <li>Deschide aplicația <b style="color:#F0F0F0;">LEX AI</b></li>
          <li>Pe ecranul de activare, lipește cheia de mai sus</li>
          <li>Apasă <b style="color:#F0F0F0;">Activează licența</b></li>
        </ol>
      </div>

      <a href="${DOWNLOAD_URL}"
         style="display:inline-block;padding:12px 28px;background:#C9A84C;color:#0f1115;font-weight:700;font-size:14px;border-radius:7px;text-decoration:none;">
        Descarcă LEX AI →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:18px 32px;border-top:1px solid #2A3A4A;font-size:12px;color:#5C6A78;line-height:1.7;">
      Probleme? Scrieți la <a href="mailto:support@lexai.ro" style="color:#C9A84C;text-decoration:none;">support@lexai.ro</a><br/>
      LEX AI · Asistent juridic AI pentru cabinete de avocatură din România
    </div>
  </div>
</body>
</html>`;

  return { from: FROM_EMAIL, to, subject, html };
}

// ---------------------------------------------------------------------------
// Raw body reader (needed because bodyParser is disabled)
// ---------------------------------------------------------------------------
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * checkout.session.completed
 * - mode=subscription → 30-day trial key (Stripe trial runs in parallel)
 * - mode=payment      → LIFETIME key (for future one-time payment link)
 */
async function handleCheckout(session, resend) {
  const email = session.customer_details?.email || session.customer_email;
  if (!email) {
    console.error('[webhook] No customer email on session', session.id);
    return;
  }

  let plan, expiry, planLabel;

  if (session.mode === 'payment') {
    // One-time lifetime purchase
    plan = 'lifetime';
    expiry = 'LIFETIME';
    planLabel = 'Licență Perpetuă';
  } else {
    // Subscription — send a trial key that covers Stripe's 30-day trial period
    plan = 'monthly';
    expiry = expiryInDays(30);
    planLabel = 'Abonament Lunar · Trial';
  }

  const key = generateKey(plan, expiry, session.id);
  console.log(`[webhook] checkout.session.completed: mode=${session.mode} email=${email} plan=${plan} expiry=${expiry}`);

  const emailPayload = buildEmail(email, { planLabel, licenseKey: key, expiry, isRenewal: false });
  const { error } = await resend.emails.send(emailPayload);
  if (error) console.error('[webhook] Resend error:', error);
  else console.log(`[webhook] Key emailed to ${email}`);
}

/**
 * invoice.payment_succeeded
 * Fires on every successful subscription payment (including after trial ends).
 * We issue a fresh 35-day key so the customer stays active through the next cycle.
 */
async function handleInvoicePayment(invoice, resend) {
  // Skip zero-amount invoices (trial, free adjustments, etc.)
  if (!invoice.amount_paid || invoice.amount_paid === 0) {
    console.log('[webhook] Skipping zero-amount invoice', invoice.id);
    return;
  }
  // Only handle subscription billing
  const validReasons = ['subscription_create', 'subscription_cycle', 'subscription_update'];
  if (!validReasons.includes(invoice.billing_reason)) {
    console.log(`[webhook] Skipping invoice with billing_reason=${invoice.billing_reason}`);
    return;
  }

  const email = invoice.customer_email;
  if (!email) {
    console.error('[webhook] No customer email on invoice', invoice.id);
    return;
  }

  const expiry = expiryInDays(35);
  const key = generateKey('monthly', expiry, invoice.id);
  const isRenewal = invoice.billing_reason === 'subscription_cycle';

  console.log(`[webhook] invoice.payment_succeeded: email=${email} reason=${invoice.billing_reason} expiry=${expiry}`);

  const emailPayload = buildEmail(email, {
    planLabel: 'Abonament Lunar',
    licenseKey: key,
    expiry,
    isRenewal,
  });
  const { error } = await resend.emails.send(emailPayload);
  if (error) console.error('[webhook] Resend error:', error);
  else console.log(`[webhook] ${isRenewal ? 'Renewal' : 'First-payment'} key emailed to ${email}`);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET env var not set');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Invalid signature: ${err.message}` });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckout(event.data.object, resend);
    } else if (event.type === 'invoice.payment_succeeded') {
      await handleInvoicePayment(event.data.object, resend);
    }
  } catch (err) {
    // Log but return 200 — Stripe retries on non-2xx responses
    console.error('[webhook] Handler error:', err);
  }

  return res.status(200).json({ received: true });
};

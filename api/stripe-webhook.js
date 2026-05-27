/**
 * api/stripe-webhook.js — Vercel Serverless Function
 *
 * Stripe calls this endpoint after a payment is confirmed.
 * We verify the signature, generate an HMAC-signed license key,
 * and email it to the customer via Resend.
 *
 * Required env vars on Vercel:
 *   STRIPE_SECRET_KEY      — from Stripe Dashboard → Developers → API keys
 *   STRIPE_WEBHOOK_SECRET  — from Stripe Dashboard → Webhooks → your endpoint → signing secret
 *   RESEND_API_KEY         — from resend.com → API Keys
 *   LEXAI_LICENSE_SECRET   — must match the secret in the Electron app's licenseManager.js
 *
 * Stripe webhook events to enable (in Stripe Dashboard → Webhooks):
 *   checkout.session.completed   — initial purchase (monthly + lifetime)
 *   invoice.payment_succeeded    — monthly subscription renewals
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const { Resend } = require('resend');

// Disable Vercel's automatic body parsing — Stripe needs the raw buffer to verify the signature
module.exports.config = { api: { bodyParser: false } };

// Must match LEXAI_LICENSE_SECRET in the Electron app's licenseManager.js
const HMAC_SECRET =
  process.env.LEXAI_LICENSE_SECRET ||
  'lexai-license-v1-xK9mP2qR7nL4wJ8s-CHANGE-BEFORE-SHIP';

const FROM_EMAIL = process.env.FROM_EMAIL || 'LEX AI <noreply@lexai.ro>';
const DOWNLOAD_URL = 'https://lexai-website.vercel.app/descarcare';

// ---------------------------------------------------------------------------
// License key generation (mirrors licenseManager.js in the Electron app)
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

function expiryForPlan(plan) {
  if (plan === 'lifetime') return 'LIFETIME';
  // Monthly: 35 days (5-day grace buffer on top of the 30-day billing cycle)
  const d = new Date();
  d.setDate(d.getDate() + 35);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Plan detection
// ---------------------------------------------------------------------------
function detectPlan(clientRefId, amountTotal) {
  // Primary: use the client_reference_id we embedded in the Stripe URL
  if (clientRefId === 'monthly') return 'monthly';
  if (clientRefId === 'perpetual' || clientRefId === 'lifetime') return 'lifetime';
  // Fallback: amount (cents). €150 = 15000, €2000 = 200000
  if (amountTotal >= 190000) return 'lifetime';
  return 'monthly';
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------
function buildEmail(email, plan, licenseKey, expiry) {
  const isLifetime = expiry === 'LIFETIME';
  const planLabel = isLifetime ? 'Licență Perpetuă' : 'Abonament Lunar';
  const expiryNote = isLifetime
    ? '<p style="color:#4A9B7F;font-size:13px;margin:0 0 20px;">✓ Această licență nu expiră.</p>'
    : `<p style="color:#8A99A8;font-size:13px;margin:0 0 20px;">Cheia este valabilă 35 de zile (până pe <b>${expiry}</b>). Vei primi automat o cheie nouă la fiecare reînnoire.</p>`;

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:40px 20px;background:#0F1419;font-family:system-ui,-apple-system,sans-serif;color:#F0F0F0;">
  <div style="max-width:560px;margin:0 auto;background:#131B23;border:1px solid #2A3A4A;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="padding:28px 32px 20px;border-bottom:1px solid #2A3A4A;text-align:center;">
      <div style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:6px;color:#C9A84C;">LEX·AI</div>
      <div style="font-size:13px;color:#8A99A8;margin-top:6px;">Cheia ta de licență · ${planLabel}</div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;">Mulțumim pentru achiziție!</p>
      <p style="margin:0 0 20px;font-size:13.5px;color:#8A99A8;line-height:1.6;">
        Aplicația LEX AI este acum activată pentru planul <b style="color:#C9A84C;">${planLabel}</b>.
        Copiați cheia de mai jos și introduceți-o în aplicație.
      </p>

      <!-- Key box -->
      <div style="background:#0F1419;border:1px solid rgba(201,168,76,0.3);border-radius:8px;padding:18px 20px;margin:0 0 12px;">
        <div style="font-family:monospace;font-size:11px;letter-spacing:0.08em;color:#8A99A8;margin-bottom:8px;text-transform:uppercase;">Cheie de licență</div>
        <div style="font-family:monospace;font-size:12px;color:#C9A84C;word-break:break-all;line-height:1.6;">${licenseKey}</div>
      </div>

      ${expiryNote}

      <!-- Steps -->
      <div style="background:#1A2332;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <div style="font-size:12px;font-weight:600;letter-spacing:0.08em;color:#8A99A8;text-transform:uppercase;margin-bottom:12px;">Cum activezi</div>
        <ol style="margin:0;padding-left:18px;color:#8A99A8;font-size:13.5px;line-height:1.9;">
          <li>Descarcă și deschide aplicația LEX AI</li>
          <li>Pe ecranul <b style="color:#F0F0F0;">„Activare licență"</b>, lipește cheia de mai sus</li>
          <li>Apasă <b style="color:#F0F0F0;">Activează licența</b></li>
        </ol>
      </div>

      <!-- Download CTA -->
      <a href="${DOWNLOAD_URL}" style="display:inline-block;padding:12px 28px;background:#C9A84C;color:#0f1115;font-weight:700;font-size:14px;border-radius:7px;text-decoration:none;letter-spacing:0.02em;">
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

  return {
    from: FROM_EMAIL,
    to: email,
    subject: `Cheia ta de licență LEX AI — ${planLabel}`,
    html,
  };
}

// ---------------------------------------------------------------------------
// Raw body helper (Vercel doesn't give you the raw buffer with bodyParser off)
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
// Handlers
// ---------------------------------------------------------------------------
async function handleCheckout(session, resend) {
  const email = session.customer_details?.email || session.customer_email;
  if (!email) {
    console.error('[webhook] No email on session:', session.id);
    return;
  }

  const plan = detectPlan(session.client_reference_id, session.amount_total);
  const expiry = expiryForPlan(plan);
  const key = generateKey(plan, expiry, session.id);

  console.log(`[webhook] checkout.session.completed: email=${email} plan=${plan} expiry=${expiry}`);

  const emailPayload = buildEmail(email, plan, key, expiry);
  const { error } = await resend.emails.send(emailPayload);
  if (error) {
    console.error('[webhook] Resend error:', error);
  } else {
    console.log(`[webhook] Key emailed to ${email}`);
  }
}

async function handleInvoiceRenewal(invoice, resend) {
  // Fires on every successful monthly subscription billing cycle
  if (invoice.status !== 'paid') return;

  const email = invoice.customer_email;
  if (!email) {
    console.error('[webhook] No email on invoice:', invoice.id);
    return;
  }

  // Always treat invoice renewals as monthly (subscriptions renew monthly)
  const plan = 'monthly';
  const expiry = expiryForPlan(plan);
  const key = generateKey(plan, expiry, invoice.id);

  console.log(`[webhook] invoice.payment_succeeded: email=${email} expiry=${expiry}`);

  const emailPayload = buildEmail(email, plan, key, expiry);
  const { error } = await resend.emails.send(emailPayload);
  if (error) {
    console.error('[webhook] Resend error on renewal:', error);
  } else {
    console.log(`[webhook] Renewal key emailed to ${email}`);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Verify Stripe signature ---
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  // --- Route events ---
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckout(event.data.object, resend);
    } else if (event.type === 'invoice.payment_succeeded') {
      await handleInvoiceRenewal(event.data.object, resend);
    }
    // Other events are acknowledged but ignored
  } catch (err) {
    console.error('[webhook] Handler error:', err);
    // Still return 200 — we don't want Stripe to retry on our own logic errors
  }

  return res.status(200).json({ received: true });
};

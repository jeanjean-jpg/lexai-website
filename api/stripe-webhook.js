/**
 * api/stripe-webhook.js — Vercel Serverless Function
 *
 * Handles Stripe payment events for two flows:
 *
 * 1. SUBSCRIPTION (monthly €150, plink_1TcmcQAmTjv96v3ZcoQvGVz8)
 *    - checkout.session.completed (mode=subscription)
 *      → Send ONE permanent key tied to the Stripe customer ID.
 *        The key never changes; the app validates online daily.
 *    - invoice.upcoming (3 days before renewal)
 *      → Send "your subscription renews in 3 days" email notification.
 *    - invoice.payment_failed
 *      → Send "payment failed, update your card" email with portal link.
 *    - customer.subscription.deleted
 *      → Send "subscription cancelled" confirmation email.
 *
 * 2. ONE-TIME (lifetime €2000, plink_bJeeVc6U6dnG51r8mc)
 *    - checkout.session.completed (mode=payment)
 *      → Send LIFETIME key immediately.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY      STRIPE_WEBHOOK_SECRET  RESEND_API_KEY
 *   LEXAI_LICENSE_SECRET   FROM_EMAIL (optional)
 *
 * Stripe webhook events to enable:
 *   checkout.session.completed   invoice.upcoming
 *   invoice.payment_failed       customer.subscription.deleted
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const { Resend } = require('resend');

module.exports.config = { api: { bodyParser: false } };

const HMAC_SECRET =
  process.env.LEXAI_LICENSE_SECRET ||
  'lexai-license-v1-xK9mP2qR7nL4wJ8s-CHANGE-BEFORE-SHIP';

const FROM_EMAIL = process.env.FROM_EMAIL || 'LEX AI <noreply@lexai.software>';
const DOWNLOAD_URL = 'https://www.lexai.software/descarcare';
const PORTAL_URL = 'https://www.lexai.software/api/billing-portal';

// ---------------------------------------------------------------------------
// License key generation
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
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Email builder
// ---------------------------------------------------------------------------
function buildEmail(to, { planLabel, licenseKey, expiry, subject, bodyNote }) {
  const isLifetime = expiry === 'LIFETIME';
  const isOnline = expiry === 'ONLINE';

  let expirySection;
  if (isLifetime) {
    expirySection = `
      <div style="background:#1A3A2A;border:1px solid #2A5A3A;border-radius:8px;padding:12px 16px;margin:0 0 20px;font-size:13px;color:#4A9B7F;">
        ✓ Această licență nu expiră niciodată.
      </div>`;
  } else if (isOnline) {
    expirySection = `
      <div style="background:#1A2332;border:1px solid #2A3A4A;border-radius:8px;padding:12px 16px;margin:0 0 20px;font-size:13px;color:#8A99A8;line-height:1.6;">
        Aceasta este cheia ta <b style="color:#F0F0F0;">permanentă</b> de licență — nu se schimbă niciodată.
        Accesul se reînnoiește automat cu fiecare plată lunară, fără să fie nevoie să faci nimic.
      </div>`;
  } else {
    expirySection = `
      <div style="background:#1A2332;border:1px solid #2A3A4A;border-radius:8px;padding:12px 16px;margin:0 0 20px;font-size:13px;color:#8A99A8;line-height:1.6;">
        ${bodyNote || ''}
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:40px 20px;background:#0F1419;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#F0F0F0;">
  <div style="max-width:560px;margin:0 auto;background:#131B23;border:1px solid #2A3A4A;border-radius:12px;overflow:hidden;">

    <div style="padding:28px 32px 22px;border-bottom:1px solid #2A3A4A;text-align:center;">
      <div style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:6px;color:#C9A84C;">LEX·AI</div>
      <div style="font-size:12px;color:#8A99A8;margin-top:6px;letter-spacing:0.05em;">${planLabel.toUpperCase()}</div>
    </div>

    <div style="padding:28px 32px;">
      ${licenseKey ? `
      <div style="background:#0F1419;border:1px solid rgba(201,168,76,0.25);border-radius:8px;padding:18px 20px;margin:0 0 14px;">
        <div style="font-family:monospace;font-size:10px;letter-spacing:0.12em;color:#5C6A78;margin-bottom:10px;text-transform:uppercase;">Cheie de licență</div>
        <div style="font-family:monospace;font-size:11.5px;color:#C9A84C;word-break:break-all;line-height:1.7;">${licenseKey}</div>
      </div>
      ` : ''}

      ${expirySection}

      ${licenseKey ? `
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
      ` : ''}
    </div>

    <div style="padding:18px 32px;border-top:1px solid #2A3A4A;font-size:12px;color:#5C6A78;line-height:1.7;">
      Probleme? Scrieți la <a href="mailto:support@lexai.software" style="color:#C9A84C;text-decoration:none;">support@lexai.software</a><br/>
      LEX AI · Asistent juridic AI pentru cabinete de avocatură din România
    </div>
  </div>
</body>
</html>`;

  return { from: FROM_EMAIL, to, subject, html };
}

// ---------------------------------------------------------------------------
// Raw body reader
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
 * - mode=subscription → permanent key tied to Stripe customer ID (never rotates)
 * - mode=payment      → LIFETIME key
 */
async function handleCheckout(session, resend) {
  const email = session.customer_details?.email || session.customer_email;
  if (!email) {
    console.error('[webhook] No customer email on session', session.id);
    return;
  }

  let key, planLabel, expiry, subject;

  if (session.mode === 'payment') {
    key = generateKey('lifetime', 'LIFETIME', session.id);
    planLabel = 'Licență Perpetuă';
    expiry = 'LIFETIME';
    subject = 'Cheia ta de licență LEX AI — Licență Perpetuă';
  } else {
    // Subscription: nonce = Stripe customer ID so validate-license can look it up
    key = generateKey('monthly', 'ONLINE', session.customer);
    planLabel = 'Abonament Lunar';
    expiry = 'ONLINE';
    subject = 'Cheia ta de licență LEX AI — Abonament Lunar';
  }

  console.log(`[webhook] checkout.session.completed: mode=${session.mode} email=${email} customer=${session.customer}`);

  const emailPayload = buildEmail(email, { planLabel, licenseKey: key, expiry, subject });
  const { error } = await resend.emails.send(emailPayload);
  if (error) console.error('[webhook] Resend error:', error);
  else console.log(`[webhook] Key emailed to ${email}`);
}

/**
 * invoice.upcoming — fires 3 days before renewal (configure in Stripe Dashboard
 * → Settings → Subscriptions → Upcoming invoice reminders → 3 days).
 */
async function handleInvoiceUpcoming(invoice, resend) {
  const email = invoice.customer_email;
  if (!email) return;

  const renewalDate = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'în curând';
  const amount = invoice.amount_due ? `€${(invoice.amount_due / 100).toFixed(2)}` : '€49,50';

  const subject = 'Abonamentul LEX AI se reînnoiește în 3 zile';
  const bodyNote = `Abonamentul tău se va reînnoi automat pe <b style="color:#F0F0F0;">${renewalDate}</b> cu suma de <b style="color:#F0F0F0;">${amount}</b>. Nu este necesară nicio acțiune — plata se procesează automat.`;

  console.log(`[webhook] invoice.upcoming: email=${email} renewalDate=${renewalDate}`);

  const emailPayload = buildEmail(email, {
    planLabel: 'Abonament Lunar',
    licenseKey: null,
    expiry: null,
    subject,
    bodyNote,
  });
  const { error } = await resend.emails.send(emailPayload);
  if (error) console.error('[webhook] Resend error (upcoming):', error);
}

/**
 * invoice.payment_failed — card declined, expired card, etc.
 * Includes a link to open the Stripe billing portal from the app.
 */
async function handlePaymentFailed(invoice, resend) {
  const email = invoice.customer_email;
  if (!email) return;

  const subject = 'Plata LEX AI a eșuat — actualizați metoda de plată';
  const bodyNote = `Plata de <b style="color:#F0F0F0;">€${(invoice.amount_due / 100).toFixed(2)}</b> nu a putut fi procesată. Accesul la LEX AI va fi suspendat dacă plata nu este reluată. Deschideți aplicația LEX AI → <b style="color:#F0F0F0;">Setări → Gestionează abonamentul</b> pentru a actualiza metoda de plată.`;

  console.log(`[webhook] invoice.payment_failed: email=${email}`);

  const emailPayload = buildEmail(email, {
    planLabel: 'Abonament Lunar',
    licenseKey: null,
    expiry: null,
    subject,
    bodyNote,
  });
  const { error } = await resend.emails.send(emailPayload);
  if (error) console.error('[webhook] Resend error (payment_failed):', error);
}

/**
 * customer.subscription.deleted — subscription cancelled by user or Stripe.
 */
async function handleSubscriptionDeleted(subscription, resend) {
  // Fetch customer email (not always on the subscription object)
  let email;
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    email = customer.email;
  } catch (_) {}

  if (!email) {
    console.error('[webhook] No email for subscription.deleted', subscription.id);
    return;
  }

  const endDate = new Date(subscription.current_period_end * 1000).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const subject = 'Abonamentul LEX AI a fost anulat';
  const bodyNote = `Abonamentul tău a fost anulat. Vei putea folosi LEX AI până pe <b style="color:#F0F0F0;">${endDate}</b>, după care accesul va fi suspendat. Dacă dorești să te reabonezi, vizitează <a href="https://www.lexai.software/preturi" style="color:#C9A84C;">lexai.software/preturi</a>.`;

  console.log(`[webhook] subscription.deleted: email=${email} until=${endDate}`);

  const emailPayload = buildEmail(email, {
    planLabel: 'Abonament Lunar',
    licenseKey: null,
    expiry: null,
    subject,
    bodyNote,
  });
  const { error } = await resend.emails.send(emailPayload);
  if (error) console.error('[webhook] Resend error (sub.deleted):', error);
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
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckout(event.data.object, resend);
        break;
      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object, resend);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, resend);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, resend);
        break;
      default:
        // Ignore other events — return 200 so Stripe doesn't retry
        break;
    }
  } catch (err) {
    console.error('[webhook] Handler error:', err);
  }

  return res.status(200).json({ received: true });
};

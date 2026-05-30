/**
 * api/billing-portal.js — Vercel Serverless Function
 *
 * Generates a Stripe Customer Portal session URL for the authenticated
 * customer embedded in the license key. The app opens the URL in the
 * system browser so the user can cancel, update their card, see invoices.
 *
 * POST /api/billing-portal
 * Body: { key: "<license key>" }
 *
 * Response: { url: "https://billing.stripe.com/session/..." }
 *
 * Prerequisites: enable the Customer Portal in Stripe Dashboard →
 * Settings → Billing → Customer portal (configure what actions are allowed).
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const HMAC_SECRET =
  process.env.LEXAI_LICENSE_SECRET ||
  'lexai-license-v1-xK9mP2qR7nL4wJ8s-CHANGE-BEFORE-SHIP';

function verify(rawKey) {
  const key = String(rawKey || '').trim().replace(/\s+/g, '');
  const dotIdx = key.lastIndexOf('.');
  if (dotIdx < 4) return null;
  const data = key.slice(0, dotIdx);
  const sig = key.slice(dotIdx + 1);
  const expected = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(data)
    .digest('hex')
    .slice(0, 32);
  if (sig.toLowerCase() !== expected.toLowerCase()) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: 'missing_key' });

  const payload = verify(key);
  if (!payload || String(payload.plan).toLowerCase() !== 'monthly') {
    return res.status(400).json({ error: 'invalid_key' });
  }

  const customerId = payload.nonce;
  if (!customerId || !customerId.startsWith('cus_')) {
    return res.status(400).json({ error: 'invalid_key' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://www.lexai.software',
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error('[billing-portal] Stripe error:', err.message);
    return res.status(500).json({ error: 'stripe_error', message: err.message });
  }
};

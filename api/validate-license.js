/**
 * api/validate-license.js — Vercel Serverless Function
 *
 * Called by the Electron app on startup (and cached for 1 hour).
 * Verifies the HMAC signature of the key and checks the Stripe
 * subscription status for monthly plans.
 *
 * POST /api/validate-license
 * Body: { key: "<license key>" }
 *
 * Response:
 *   monthly active:   { active: true, plan, status, daysUntilRenewal, nextBillingDate, cancelAtPeriodEnd }
 *   monthly inactive: { active: false, plan, reason: 'payment_failed'|'subscription_inactive' }
 *   lifetime:         { active: true, plan: 'lifetime' }
 *   invalid key:      { active: false, reason: 'invalid_key' }
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
  if (!key) return res.json({ active: false, reason: 'missing_key' });

  const payload = verify(key);
  if (!payload) return res.json({ active: false, reason: 'invalid_key' });

  const plan = String(payload.plan).toLowerCase();

  // ── LIFETIME ─────────────────────────────────────────────────────────────
  if (plan === 'lifetime') {
    return res.json({ active: true, plan: 'lifetime' });
  }

  // ── MONTHLY ──────────────────────────────────────────────────────────────
  if (plan === 'monthly') {
    const customerId = payload.nonce;
    if (!customerId || !customerId.startsWith('cus_')) {
      return res.json({ active: false, reason: 'invalid_key' });
    }

    try {
      const [activeSubs, trialingSubs, pastDueSubs] = await Promise.all([
        stripe.subscriptions.list({ customer: customerId, status: 'active',   limit: 1 }),
        stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 }),
        stripe.subscriptions.list({ customer: customerId, status: 'past_due', limit: 1 }),
      ]);

      const sub = activeSubs.data[0] || trialingSubs.data[0];

      if (sub) {
        const daysUntilRenewal = Math.ceil(
          (sub.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return res.json({
          active: true,
          plan: 'monthly',
          status: sub.status, // 'active' or 'trialing'
          daysUntilRenewal,
          nextBillingDate: new Date(sub.current_period_end * 1000).toISOString().slice(0, 10),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
      }

      if (pastDueSubs.data[0]) {
        return res.json({
          active: false,
          plan: 'monthly',
          reason: 'payment_failed',
          nextBillingDate: new Date(
            pastDueSubs.data[0].current_period_end * 1000
          ).toISOString().slice(0, 10),
        });
      }

      return res.json({ active: false, plan: 'monthly', reason: 'subscription_inactive' });
    } catch (err) {
      console.error('[validate] Stripe error:', err.message);
      return res.status(500).json({ active: false, reason: 'server_error' });
    }
  }

  return res.json({ active: false, reason: 'unknown_plan' });
};

/**
 * api/updates.js — Vercel Serverless Function
 *
 * License-gated update gateway for the Squirrel.Windows auto-updater.
 *
 * Routed via a vercel.json rewrite:
 *   /api/updates/:path*  ->  /api/updates?path=:path*
 * so the desktop feed URL works unchanged:
 *   https://www.lexai.software/api/updates/<licenseKey>/win32
 * Squirrel then requests:
 *   .../<licenseKey>/win32/RELEASES   and   .../<licenseKey>/win32/<file>.nupkg
 *
 * We validate the key (HMAC + Stripe for monthly) and 302-redirect an entitled
 * request to the matching asset on the PUBLIC GitHub Releases repo.
 *
 * Entitlement:
 *   LIFETIME             -> always served (lifetime updates)
 *   MONTHLY active/trial -> served
 *   MONTHLY lapsed       -> 403 (app stops auto-updating; runtime read-only is
 *                           the real enforcement)
 *   trial / invalid key  -> served latest (binaries are public anyway)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const HMAC_SECRET =
  process.env.LEXAI_LICENSE_SECRET ||
  'lexai-license-v1-xK9mP2qR7nL4wJ8s-CHANGE-BEFORE-SHIP';

const GITHUB_BASE = 'https://github.com/jeanjean-jpg/lexai-releases/releases/latest/download';

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

async function isEntitled(key) {
  const payload = verify(key);
  if (!payload) return true; // trial / unknown — public binaries, runtime-gated
  const plan = String(payload.plan || '').toLowerCase();
  if (plan === 'lifetime') return true;
  if (plan === 'monthly') {
    const customerId = payload.nonce;
    if (!customerId || !String(customerId).startsWith('cus_')) return false;
    try {
      const [active, trialing] = await Promise.all([
        stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 }),
        stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 }),
      ]);
      return !!(active.data[0] || trialing.data[0]);
    } catch (_) {
      return true; // Stripe outage — don't block paying users from updates
    }
  }
  return true;
}

function safeAsset(file) {
  if (file === 'RELEASES') return 'RELEASES';
  if (/^[A-Za-z0-9._-]+\.nupkg$/.test(file)) return file;
  if (/^[A-Za-z0-9._ -]+\.exe$/.test(file)) return file;
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // The rewrite delivers the path as a slash-joined string in req.query.path;
  // accept an array too for safety.
  let raw = (req.query && req.query.path) || '';
  if (Array.isArray(raw)) raw = raw.join('/');
  const parts = String(raw).split('/').filter(Boolean);
  if (parts.length < 3) return res.status(400).json({ error: 'bad_path' });

  const key = decodeURIComponent(parts[0]);
  const platform = parts[1];
  const file = parts[parts.length - 1];

  if (platform !== 'win32') return res.status(404).json({ error: 'unsupported_platform' });

  const asset = safeAsset(file);
  if (!asset) return res.status(404).json({ error: 'not_found' });

  const entitled = await isEntitled(key);
  if (!entitled) return res.status(403).json({ error: 'not_entitled' });

  res.setHeader('Location', `${GITHUB_BASE}/${asset}`);
  return res.status(302).end();
};

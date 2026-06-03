/**
 * api/updates/[...path].js — Vercel Serverless Function (catch-all)
 *
 * License-gated update gateway for the Squirrel.Windows auto-updater.
 *
 * The desktop app sets its feed URL to:
 *   https://www.lexai.software/api/updates/<licenseKey>/win32
 * Squirrel then requests:
 *   .../<licenseKey>/win32/RELEASES
 *   .../<licenseKey>/win32/LexAI-x.y.z-full.nupkg   (and delta)
 *
 * We validate the key (HMAC + Stripe for monthly), and for an entitled request
 * 302-redirect to the matching asset on the PUBLIC GitHub Releases repo:
 *   https://github.com/jeanjean-jpg/lexai-releases/releases/latest/download/<file>
 *
 * Entitlement:
 *   LIFETIME            → always served (lifetime updates)
 *   MONTHLY active/trial→ served
 *   MONTHLY lapsed      → 403 (their installed app stays, but stops auto-updating;
 *                          runtime read-only is the real enforcement)
 *   trial / invalid key → served latest (binaries are public anyway; this lets
 *                          trial users stay current so they can convert)
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

// Returns true if this key is entitled to receive updates right now.
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
      // On a Stripe outage, fail open so paying users aren't blocked from updates.
      return true;
    }
  }
  return true;
}

// Only allow the file names Squirrel actually requests.
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

  // req.query.path = ['<key>', 'win32', '<file>']
  const parts = (req.query && req.query.path) || [];
  if (!Array.isArray(parts) || parts.length < 3) {
    return res.status(400).json({ error: 'bad_path' });
  }
  const key = decodeURIComponent(parts[0]);
  const platform = parts[1];
  const file = parts[parts.length - 1];

  if (platform !== 'win32') return res.status(404).json({ error: 'unsupported_platform' });

  const asset = safeAsset(file);
  if (!asset) return res.status(404).json({ error: 'not_found' });

  const entitled = await isEntitled(key);
  if (!entitled) return res.status(403).json({ error: 'not_entitled' });

  // 302 to the public GitHub Releases asset.
  res.setHeader('Location', `${GITHUB_BASE}/${asset}`);
  return res.status(302).end();
};

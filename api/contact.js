/**
 * api/contact.js — Vercel Serverless Function
 *
 * Receives the /contact form submission and emails it to the right ImprovMX
 * inbox via Resend, with reply-to set to the visitor so a plain "Reply" reaches
 * them.
 *
 * Routing is decided SERVER-SIDE from the category id (never trust the client):
 *   - support  → support@lexai.software  (technical / license / billing / usage)
 *   - sales    → contact@lexai.software  (pre-sale / partnership / other)
 *
 * Required env vars:
 *   RESEND_API_KEY          FROM_EMAIL (optional, defaults to noreply@lexai.software)
 */

const { Resend } = require('resend');

const FROM_EMAIL = process.env.FROM_EMAIL || 'LEX AI <noreply@lexai.software>';
const SUPPORT_INBOX = 'support@lexai.software';
const SALES_INBOX = 'contact@lexai.software';

// Category id → { label (RO), inbox }. The client sends only the id.
const CATEGORIES = {
  tehnic:    { label: 'Problemă tehnică / eroare în aplicație', inbox: SUPPORT_INBOX },
  licenta:   { label: 'Activare licență / cheie',               inbox: SUPPORT_INBOX },
  facturare: { label: 'Facturare și plăți',                     inbox: SUPPORT_INBOX },
  utilizare: { label: 'Ajutor cu utilizarea aplicației',        inbox: SUPPORT_INBOX },
  vanzari:   { label: 'Întrebare înainte de cumpărare',         inbox: SALES_INBOX },
  parteneriat:{ label: 'Parteneriat / colaborare',              inbox: SALES_INBOX },
  altceva:   { label: 'Altă întrebare',                         inbox: SALES_INBOX },
};

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  // Honeypot: real users never fill this hidden field. Pretend success.
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const categoryId = String(body.category || '').trim();
  const message = String(body.message || '').trim().slice(0, 5000);

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresă de email invalidă.' });
  }
  if (!message || message.length < 5) {
    return res.status(400).json({ error: 'Mesajul este prea scurt.' });
  }

  const cat = CATEGORIES[categoryId] || CATEGORIES.altceva;
  const senderName = name || 'Vizitator';

  const subject = `[Contact · ${cat.label}] ${senderName}`;

  const html = `<!DOCTYPE html>
<html lang="ro"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px 20px;background:#0F1419;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#F0F0F0;">
  <div style="max-width:560px;margin:0 auto;background:#131B23;border:1px solid #2A3A4A;border-radius:12px;overflow:hidden;">
    <div style="padding:22px 28px;border-bottom:1px solid #2A3A4A;">
      <div style="font-family:monospace;font-size:18px;font-weight:700;letter-spacing:5px;color:#C9A84C;">LEX·AI</div>
      <div style="font-size:12px;color:#8A99A8;margin-top:6px;">Mesaj nou din formularul de contact</div>
    </div>
    <div style="padding:24px 28px;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 6px;color:#5C6A78;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Categorie</p>
      <p style="margin:0 0 18px;color:#F0F0F0;">${esc(cat.label)}</p>

      <p style="margin:0 0 6px;color:#5C6A78;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Nume</p>
      <p style="margin:0 0 18px;color:#F0F0F0;">${esc(senderName)}</p>

      <p style="margin:0 0 6px;color:#5C6A78;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Email</p>
      <p style="margin:0 0 18px;color:#C9A84C;"><a href="mailto:${esc(email)}" style="color:#C9A84C;text-decoration:none;">${esc(email)}</a></p>

      <p style="margin:0 0 6px;color:#5C6A78;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Mesaj</p>
      <div style="margin:0;color:#F0F0F0;white-space:pre-wrap;background:#0F1419;border:1px solid #2A3A4A;border-radius:8px;padding:14px 16px;">${esc(message)}</div>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #2A3A4A;font-size:12px;color:#5C6A78;">
      Răspunde direct la acest email pentru a-i scrie expeditorului.
    </div>
  </div>
</body></html>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: cat.inbox,
      reply_to: email,
      subject,
      html,
    });
    if (error) {
      console.error('[contact] Resend error:', error);
      return res.status(502).json({ error: 'Trimiterea a eșuat. Încercați din nou.' });
    }
  } catch (err) {
    console.error('[contact] Handler error:', err);
    return res.status(500).json({ error: 'Eroare de server. Încercați din nou.' });
  }

  return res.status(200).json({ ok: true });
};

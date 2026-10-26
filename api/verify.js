// Verifies the Google ID token, checks the email allowlist, and sets a signed session cookie.
// Defaults below make it work immediately; env vars (GOOGLE_CLIENT_ID, ALLOWED_EMAILS,
// APP_SECRET) override them.
const crypto = require('crypto');

const DEFAULT_CLIENT_ID = '848559795512-nrc7d8ctgsbt8l3b58qsffv3clbe7d8u.apps.googleusercontent.com';
const DEFAULT_ALLOWED   = ['ferhan.aust@gmail.com','iqbal14041986@gmail.com','arbabkhanpanni@gmail.com','riyadh.hassan.me@gmail.com'];   // <-- add more Gmail addresses here
const DEFAULT_SECRET    = '6c0c06d8d4e060c4946ffc1a986f551927434994f71aa6e1a0e314a75657a6b3';

function b64u(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const secret = process.env.APP_SECRET || DEFAULT_SECRET;

  const body = req.body || {};
  const credential = body.credential || body.id_token;
  if (!credential) {
    res.status(400).json({ error: 'missing_credential' });
    return;
  }

  let info;
  try {
    const vr = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
    if (!vr.ok) {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }
    info = await vr.json();
  } catch (e) {
    res.status(502).json({ error: 'verify_failed' });
    return;
  }

  const email = String(info.email || '').toLowerCase().trim();
  const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
  if (!email) {
    res.status(401).json({ error: 'no_email' });
    return;
  }
  if (info.aud !== clientId) {
    res.status(401).json({ error: 'aud_mismatch' });
    return;
  }

  // Allowed emails: env ALLOWED_EMAILS if provided, else the DEFAULT_ALLOWED list above.
  const envAllowed = String(process.env.ALLOWED_EMAILS || '')
    .toLowerCase().split(/[,\s]+/).filter(Boolean);
  const allowed = envAllowed.length ? envAllowed : DEFAULT_ALLOWED.map(function (e) { return e.toLowerCase(); });

  if (allowed.indexOf(email) === -1) {
    res.status(403).json({ error: 'not_allowed', email });
    return;
  }

  const hours = 12;
  const exp = Date.now() + hours * 60 * 60 * 1000;
  const payload = b64u(Buffer.from(JSON.stringify({ email, exp }), 'utf8'));
  const sig = b64u(crypto.createHmac('sha256', secret).update(payload).digest());
  const token = payload + '.' + sig;

  res.setHeader('Set-Cookie',
    'excel_session=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + (hours * 3600));
  res.status(200).json({ ok: true, email });
};

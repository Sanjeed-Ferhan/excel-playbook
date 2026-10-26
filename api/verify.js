// Verifies the Google ID token, checks the email allowlist, and sets a signed session cookie.
const crypto = require('crypto');

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

  const secret = process.env.APP_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'not_configured' });
    return;
  }

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
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  if (!email) {
    res.status(401).json({ error: 'no_email' });
    return;
  }
  if (clientId && info.aud !== clientId) {
    res.status(401).json({ error: 'aud_mismatch' });
    return;
  }

  // Allowed emails (comma/space separated). If empty, any signed-in Google account is allowed.
  const allowed = String(process.env.ALLOWED_EMAILS || '')
    .toLowerCase().split(/[,\s]+/).filter(Boolean);
  if (allowed.length && allowed.indexOf(email) === -1) {
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

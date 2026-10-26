// Vercel Edge Middleware — protects the training page.
// Uses APP_SECRET if set, otherwise the built-in default secret below.
// (Set APP_SECRET in Vercel for stronger security — the default is visible in this public repo.)

const DEFAULT_SECRET = '6c0c06d8d4e060c4946ffc1a986f551927434994f71aa6e1a0e314a75657a6b3';
const enc = new TextEncoder();

function b64uToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
}

async function validSession(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const p = parts[0], s = parts[1];
  try {
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const ok = await crypto.subtle.verify('HMAC', key, b64uToBytes(s), enc.encode(p));
    if (!ok) return false;
    const json = JSON.parse(new TextDecoder().decode(b64uToBytes(p)));
    if (!json.exp || json.exp < Date.now()) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export const config = { matcher: ['/', '/index.html'] };

export default async function middleware(req) {
  const secret = process.env.APP_SECRET || DEFAULT_SECRET;

  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)excel_session=([^;]+)/);
  const token = m ? decodeURIComponent(m[1]) : '';

  if (await validSession(token, secret)) return; // signed-in & allowed

  const url = new URL('/login.html', req.url);
  return Response.redirect(url, 302);
}

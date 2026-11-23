// Admin login on the website: Admin ID + password, instead of a link sent on WhatsApp.
// Passwords are kept only as scrypt hashes. Too many wrong tries for an ID or from one
// address wait 15 minutes. A good login gives the same 24-hour dashboard secret as before.
import crypto from 'crypto';
import { escapeHtml } from './pageKit';

const KEY_LENGTH = 32;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function checkPassword(password: string, stored: string | null): boolean {
  const [kind, salt, hash] = (stored ?? '').split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length);
  return expected.length === KEY_LENGTH && crypto.timingSafeEqual(actual, expected);
}

// 8 to 72 characters (long enough to guess slowly, short enough to stop huge inputs)
export const passwordOk = (p: unknown): p is string => typeof p === 'string' && p.length >= 8 && p.length <= 72;

// "adm-4821 " -> "ADM-4821"
export const normalAdminCode = (id: unknown) => (typeof id === 'string' ? id.trim().toUpperCase() : '');

// ---- Wrong tries: 5 per Admin ID and 20 per address in 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const tries = new Map<string, { count: number; since: number }>();
const LIMITS = { id: 5, ip: 20 };

function tooMany(key: string, limit: number): boolean {
  const t = tries.get(key);
  if (!t || Date.now() - t.since > WINDOW_MS) return false;
  return t.count >= limit;
}

export function loginBlocked(id: string, ip: string): boolean {
  return tooMany('id:' + id, LIMITS.id) || tooMany('ip:' + ip, LIMITS.ip);
}

export function loginFailed(id: string, ip: string) {
  for (const key of ['id:' + id, 'ip:' + ip]) {
    const t = tries.get(key);
    if (!t || Date.now() - t.since > WINDOW_MS) tries.set(key, { count: 1, since: Date.now() });
    else t.count++;
  }
}

export function loginSucceeded(id: string) {
  tries.delete('id:' + id);
}

// ---- The login page
export function renderLoginPage(notice: 'expired' | 'out' | null): string {
  const note =
    notice === 'expired'
      ? 'Your session has ended. Please log in again.'
      : notice === 'out'
        ? 'You have logged out.'
        : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#1f3c88">
<meta name="robots" content="noindex">
<title>Admin login · Smart Village</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;
  font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#eef2f9;color:#1d2433}
.box{width:100%;max-width:380px;background:#fff;border-radius:18px;box-shadow:0 10px 30px rgba(31,60,136,.12);padding:28px 22px}
.logo{width:56px;height:56px;border-radius:16px;background:#1f3c88;color:#fff;display:grid;place-items:center;margin:0 auto 12px}
h1{margin:0;text-align:center;font-size:1.35rem}
.sub{margin:4px 0 20px;text-align:center;color:#6b7385;font-size:.92rem}
label{display:block;font-weight:700;font-size:.9rem;margin:14px 0 6px}
input{width:100%;padding:12px 14px;border:1.5px solid #d6dce5;border-radius:12px;font:inherit;font-size:1rem}
input:focus{outline:none;border-color:#1f3c88;box-shadow:0 0 0 3px rgba(31,60,136,.15)}
#code{text-transform:uppercase;letter-spacing:.05em}
button{width:100%;margin-top:20px;padding:13px;border:0;border-radius:12px;background:#1f3c88;color:#fff;font:inherit;font-weight:700;font-size:1rem;cursor:pointer}
button:disabled{opacity:.6}
.msg{min-height:1.3em;margin:12px 0 0;text-align:center;font-size:.9rem;color:#b42318}
.note{background:#eef3ff;color:#1f3c88;border-radius:10px;padding:9px 12px;font-size:.88rem;text-align:center;margin-bottom:6px}
.help{margin:18px 0 0;text-align:center;color:#6b7385;font-size:.8rem;line-height:1.4}
</style></head><body>
<form class="box" id="f" autocomplete="on">
  <div class="logo"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
  <h1>Admin login</h1>
  <p class="sub">Smart Village marketplace</p>
  ${note ? `<p class="note">${escapeHtml(note)}</p>` : ''}
  <label for="code">Admin ID</label>
  <input id="code" name="username" autocomplete="username" placeholder="SVADMIN" required maxlength="20" autocapitalize="characters" spellcheck="false">
  <label for="pw">Password</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" required maxlength="72">
  <button type="submit" id="go">Log in</button>
  <p class="msg" id="msg" role="alert"></p>
  <p class="help">Your Admin ID and password are given by the Smart Village project team.<br>Forgot your password? Ask them for a new one.</p>
</form>
<script>
const f = document.getElementById('f'), go = document.getElementById('go'), msg = document.getElementById('msg');
f.addEventListener('submit', async (e) => {
  e.preventDefault();
  go.disabled = true; msg.textContent = '';
  try {
    const res = await fetch('/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: document.getElementById('code').value, password: document.getElementById('pw').value }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.url) { location.replace(j.url); return; }
    msg.textContent = res.status === 429 ? 'Too many wrong tries. Please wait 15 minutes and try again.'
      : res.status === 401 ? 'Admin ID or password is wrong.' : 'Something went wrong. Please try again.';
  } catch { msg.textContent = 'No connection. Please try again.'; }
  go.disabled = false;
});
</script></body></html>`;
}

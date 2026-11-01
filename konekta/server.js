import express from 'express';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10kb' }));

// ---------------------------------------------------------------------------
// OTP / PIN verification (email via Brevo or Gmail, SMS via Semaphore)
// ---------------------------------------------------------------------------
const OTP_TTL_MS = 10 * 60 * 1000;      // PIN valid for 10 minutes
const OTP_RESEND_MS = 60 * 1000;        // wait 60s before resending
const OTP_MAX_ATTEMPTS = 5;             // wrong tries before PIN is invalidated
const otpStore = new Map();             // key -> { hash, expires, attempts, lastSent }

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL; // must be a verified sender in Brevo
const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY;
const SEMAPHORE_SENDER = process.env.SEMAPHORE_SENDER_NAME; // optional

const mailer = GMAIL_USER && GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 })
  : null;

const hashCode = (key, code) =>
  crypto.createHash('sha256').update(`${key}:${code}:${process.env.OTP_SECRET || 'konekta'}`).digest('hex');

// Returns { type: 'email' | 'phone', key } or null if invalid
function parseIdentifier(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { type: 'email', key: v };
  const digits = v.replace(/[\s\-()+]/g, '');
  if (/^(09\d{9}|639\d{9}|9\d{9})$/.test(digits)) {
    const national = digits.replace(/^(0|63)/, '');
    return { type: 'phone', key: `63${national}` };
  }
  return null;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of otpStore) if (v.expires < now) otpStore.delete(k);
}, 60 * 1000).unref();

app.post('/api/otp/send', async (req, res) => {
  const id = parseIdentifier(req.body?.identifier);
  if (!id) return res.status(400).json({ ok: false, error: 'Mali ang email o mobile number.' });

  const existing = otpStore.get(id.key);
  if (existing && Date.now() - existing.lastSent < OTP_RESEND_MS) {
    const wait = Math.ceil((OTP_RESEND_MS - (Date.now() - existing.lastSent)) / 1000);
    return res.status(429).json({ ok: false, error: `Maghintay ng ${wait} segundo bago humingi ulit ng PIN.`, retryAfter: wait });
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const message = `Ang iyong Konekta PIN code ay ${code}. Valid ito sa loob ng 10 minuto. Huwag ibahagi sa iba.`;

  try {
    if (id.type === 'email') {
      if (BREVO_API_KEY && BREVO_SENDER_EMAIL) {
        const r = await fetch('https://api.brevo.com/v3/smtp/email', {
          signal: AbortSignal.timeout(15000),
          method: 'POST',
          headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({
            sender: { name: 'Konekta', email: BREVO_SENDER_EMAIL },
            to: [{ email: id.key }],
            subject: `Konekta PIN code: ${code}`,
            textContent: message,
            htmlContent: `<div style="font-family:sans-serif"><h2 style="color:#2563eb">Konekta</h2><p>Ang iyong PIN code:</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p><p>Valid sa loob ng 10 minuto. Huwag ibahagi sa iba.</p></div>`,
          }),
        });
        if (!r.ok) throw new Error(`Brevo ${r.status} ${await r.text()}`);
      } else if (mailer) {
        await mailer.sendMail({
          from: `Konekta <${GMAIL_USER}>`,
          to: id.key,
          subject: `Konekta PIN code: ${code}`,
          text: message,
          html: `<div style="font-family:sans-serif"><h2 style="color:#2563eb">Konekta</h2><p>Ang iyong PIN code:</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p><p>Valid sa loob ng 10 minuto. Huwag ibahagi sa iba.</p></div>`,
        });
      } else if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Email PIN para kay ${id.key}: ${code}`);
      } else {
        return res.status(503).json({ ok: false, error: 'Hindi pa naka-set up ang email sender ng server.' });
      }
    } else {
      if (SEMAPHORE_API_KEY) {
        const body = new URLSearchParams({ apikey: SEMAPHORE_API_KEY, number: id.key, message });
        if (SEMAPHORE_SENDER) body.set('sendername', SEMAPHORE_SENDER);
        const r = await fetch('https://api.semaphore.co/api/v4/messages', { method: 'POST', body, signal: AbortSignal.timeout(15000) });
        if (!r.ok) throw new Error(`Semaphore ${r.status}`);
      } else if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] SMS PIN para kay ${id.key}: ${code}`);
      } else {
        return res.status(503).json({ ok: false, error: 'Hindi pa available ang SMS. Gumamit ng email.' });
      }
    }
  } catch (err) {
    console.error('OTP send failed:', err.message);
    return res.status(502).json({ ok: false, error: 'Hindi naipadala ang PIN. Subukan ulit mamaya.' });
  }

  otpStore.set(id.key, { hash: hashCode(id.key, code), expires: Date.now() + OTP_TTL_MS, attempts: 0, lastSent: Date.now() });
  res.json({ ok: true, channel: id.type, resendIn: OTP_RESEND_MS / 1000 });
});

app.post('/api/otp/verify', (req, res) => {
  const id = parseIdentifier(req.body?.identifier);
  const code = String(req.body?.code || '').trim();
  if (!id || !/^\d{6}$/.test(code)) return res.status(400).json({ ok: false, error: 'Maling PIN.' });

  const rec = otpStore.get(id.key);
  if (!rec || rec.expires < Date.now()) {
    otpStore.delete(id.key);
    return res.status(400).json({ ok: false, error: 'Expired na ang PIN. Humingi ng bago.' });
  }
  if (rec.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(id.key);
    return res.status(429).json({ ok: false, error: 'Sobra na ang maling tangka. Humingi ng bagong PIN.' });
  }
  rec.attempts += 1;
  const a = Buffer.from(rec.hash), b = Buffer.from(hashCode(id.key, code));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(400).json({ ok: false, error: 'Mali ang PIN. Subukan ulit.' });
  }
  otpStore.delete(id.key); // one-time use
  res.json({ ok: true });
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all routes to index.html for Single Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Konekta production server is running on port ${PORT}`);
});
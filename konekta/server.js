import express from 'express';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(['/api/me', '/api/auth/signup', '/api/posts', '/api/stories', '/api/messages'], express.json({ limit: '6mb' }));
app.use(express.json({ limit: '10kb' }));


// ---------------------------------------------------------------------------
// Shared helpers: signed tokens, password hashing, Supabase REST
// ---------------------------------------------------------------------------
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.OTP_SECRET || 'konekta-dev-secret';
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000;   // login stays valid for 1 year
const PROOF_TTL_MS = 15 * 60 * 1000;                // verified-PIN proof valid for 15 minutes
const scrypt = promisify(crypto.scrypt);

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function readPayload(token) {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}

async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = await scrypt(pw, salt, 64);
  return `${salt.toString('hex')}:${h.toString('hex')}`;
}

async function checkPassword(pw, stored) {
  const [s, h] = String(stored || '').split(':');
  if (!s || !h) return false;
  const d = await scrypt(pw, Buffer.from(s, 'hex'), 64);
  const e = Buffer.from(h, 'hex');
  return d.length === e.length && crypto.timingSafeEqual(d, e);
}

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const dbReady = !!(SUPABASE_URL && SUPABASE_KEY);

async function sb(method, table, { query = '', body, prefer } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      // legacy service_role keys are JWTs and go in Authorization too;
      // the newer sb_secret_ keys are not JWTs and must only be sent as apikey
      ...(SUPABASE_KEY.startsWith('sb_') ? {} : { Authorization: `Bearer ${SUPABASE_KEY}` }),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await r.text();
  if (!r.ok) {
    const err = new Error(`Supabase ${r.status} ${text}`);
    err.status = r.status;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

const enc = encodeURIComponent;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

async function findUserByKey(key) {
  const rows = await sb('GET', 'konekta_users', { query: `?identifier=eq.${enc(key)}&select=*&limit=1` });
  return rows && rows[0] ? rows[0] : null;
}

function maskContact(v) {
  const s = String(v || '');
  if (s.includes('@')) {
    const [name, domain] = s.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  const d = s.replace(/\D/g, '');
  return d.length > 4 ? `${d.slice(0, 2)}${'*'.repeat(d.length - 4)}${d.slice(-2)}` : '***';
}

function rowToUser(r, self) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    emailOrPhone: self ? r.email_or_phone : maskContact(r.email_or_phone),
    avatar: r.avatar || '',
    coverPhoto: r.cover_photo || '',
    bio: r.bio || '',
    gender: r.gender || 'iba',
    birthday: r.birthday || undefined,
    location: r.location || '',
    work: r.work || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error('API error:', err.message);
    res.status(500).json({ ok: false, error: 'May error sa server. Subukan ulit.' });
  });

const needDb = (req, res, next) => {
  if (!dbReady) return res.status(503).json({ ok: false, error: 'Hindi pa naka-set up ang database ng server.' });
  next();
};

const needAuth = (req, res, next) => {
  const h = String(req.headers.authorization || '');
  const p = readPayload(h.startsWith('Bearer ') ? h.slice(7) : '');
  if (!p || p.t !== 'session' || !p.uid) return res.status(401).json({ ok: false, error: 'Mag-log in ulit.' });
  req.uid = p.uid;
  next();
};

const loginFails = new Map(); // key -> { count, resetAt }

// ---------------------------------------------------------------------------
// OTP / PIN verification (email via Gmail, SMS via Semaphore)
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

app.post('/api/otp/send', wrap(async (req, res) => {
  const id = parseIdentifier(req.body?.identifier);
  if (!id) return res.status(400).json({ ok: false, error: 'Mali ang email o mobile number.' });
  const purpose = req.body?.purpose === 'reset' ? 'reset' : 'signup';
  const slot = `${purpose}|${id.key}`;

  if (dbReady) {
    const found = await findUserByKey(id.key);
    if (purpose === 'signup' && found) {
      return res.status(409).json({ ok: false, error: 'May account na gamit ang email o numerong ito. Mag-log in na lang.' });
    }
    if (purpose === 'reset' && !found) {
      return res.status(404).json({ ok: false, error: 'Walang account na gumagamit ng email o numerong ito.' });
    }
  }

  const existing = otpStore.get(slot);
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

  otpStore.set(slot, { hash: hashCode(id.key, code), expires: Date.now() + OTP_TTL_MS, attempts: 0, lastSent: Date.now() });
  res.json({ ok: true, channel: id.type, resendIn: OTP_RESEND_MS / 1000 });
}));

app.post('/api/otp/verify', (req, res) => {
  const id = parseIdentifier(req.body?.identifier);
  const code = String(req.body?.code || '').trim();
  if (!id || !/^\d{6}$/.test(code)) return res.status(400).json({ ok: false, error: 'Maling PIN.' });
  const purpose = req.body?.purpose === 'reset' ? 'reset' : 'signup';
  const slot = `${purpose}|${id.key}`;

  const rec = otpStore.get(slot);
  if (!rec || rec.expires < Date.now()) {
    otpStore.delete(slot);
    return res.status(400).json({ ok: false, error: 'Expired na ang PIN. Humingi ng bago.' });
  }
  if (rec.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(slot);
    return res.status(429).json({ ok: false, error: 'Sobra na ang maling tangka. Humingi ng bagong PIN.' });
  }
  rec.attempts += 1;
  const a = Buffer.from(rec.hash), b = Buffer.from(hashCode(id.key, code));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(400).json({ ok: false, error: 'Mali ang PIN. Subukan ulit.' });
  }
  otpStore.delete(slot); // one-time use
  const proof = signPayload({ t: 'proof', k: id.key, p: purpose, exp: Date.now() + PROOF_TTL_MS });
  res.json({ ok: true, proof });
});


// ---------------------------------------------------------------------------
// Accounts, directory and friends (shared database)
// ---------------------------------------------------------------------------
const GENDERS = ['lalaki', 'babae', 'iba'];
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function sessionFor(row) {
  return signPayload({ t: 'session', uid: row.id, exp: Date.now() + SESSION_TTL_MS });
}

app.post('/api/auth/signup', needDb, wrap(async (req, res) => {
  const b = req.body || {};
  const proof = readPayload(b.proof);
  const id = parseIdentifier(b.emailOrPhone);
  if (!proof || proof.t !== 'proof' || proof.p !== 'signup' || !id || proof.k !== id.key) {
    return res.status(400).json({ ok: false, error: 'Hindi pa na-verify ang PIN. Humingi ng bagong PIN.' });
  }
  const firstName = str(b.firstName, 50), lastName = str(b.lastName, 50);
  const password = typeof b.password === 'string' ? b.password : '';
  if (!firstName || !lastName) return res.status(400).json({ ok: false, error: 'Kulang ang pangalan.' });
  if (password.length < 6 || password.length > 200) {
    return res.status(400).json({ ok: false, error: 'Ang password ay dapat 6 hanggang 200 character.' });
  }
  if (await findUserByKey(id.key)) {
    return res.status(409).json({ ok: false, error: 'May account na gamit ang email o numerong ito. Mag-log in na lang.' });
  }
  const row = {
    id: 'user_' + crypto.randomBytes(8).toString('hex'),
    identifier: id.key,
    email_or_phone: str(b.emailOrPhone, 120),
    first_name: firstName,
    last_name: lastName,
    password_hash: await hashPassword(password),
    gender: GENDERS.includes(b.gender) ? b.gender : 'iba',
    avatar: str(b.avatar, 5_000_000),
    bio: str(b.bio, 500),
    location: str(b.location, 120),
  };
  let created;
  try {
    created = await sb('POST', 'konekta_users', { body: row, prefer: 'return=representation' });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ ok: false, error: 'May account na gamit ang email o numerong ito. Mag-log in na lang.' });
    throw err;
  }
  const saved = created[0];
  await notify(saved.id, null, 'system', 'Maligayang pagdating sa Konekta! Maaari mong i-customize ang iyong Profile at Cover photo sa Profile page.', null);
  res.json({ ok: true, user: rowToUser(saved, true), token: sessionFor(saved) });
}));

app.post('/api/auth/login', needDb, wrap(async (req, res) => {
  const id = parseIdentifier(req.body?.identifier);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const bad = { ok: false, error: 'Maling email/numero o password. Pakisuri muli.' };
  if (!id || !password || password.length > 200) return res.status(401).json(bad);

  const fails = loginFails.get(id.key);
  if (fails && fails.resetAt > Date.now() && fails.count >= 10) {
    return res.status(429).json({ ok: false, error: 'Sobra na ang maling tangka. Subukan ulit pagkatapos ng 15 minuto.' });
  }
  const row = await findUserByKey(id.key);
  const ok = row ? await checkPassword(password, row.password_hash) : false;
  if (!ok) {
    const cur = fails && fails.resetAt > Date.now() ? fails : { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
    cur.count += 1;
    loginFails.set(id.key, cur);
    return res.status(401).json(bad);
  }
  loginFails.delete(id.key);
  res.json({ ok: true, user: rowToUser(row, true), token: sessionFor(row) });
}));

app.post('/api/auth/reset', needDb, wrap(async (req, res) => {
  const proof = readPayload(req.body?.proof);
  const password = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (!proof || proof.t !== 'proof' || proof.p !== 'reset') {
    return res.status(400).json({ ok: false, error: 'Hindi pa na-verify ang PIN. Humingi ng bagong PIN.' });
  }
  if (password.length < 6 || password.length > 200) {
    return res.status(400).json({ ok: false, error: 'Ang password ay dapat 6 hanggang 200 character.' });
  }
  const row = await findUserByKey(proof.k);
  if (!row) return res.status(404).json({ ok: false, error: 'Walang account na gumagamit ng email o numerong ito.' });
  const updated = await sb('PATCH', 'konekta_users', {
    query: `?id=eq.${enc(row.id)}`,
    body: { password_hash: await hashPassword(password), updated_at: new Date().toISOString() },
    prefer: 'return=representation',
  });
  loginFails.delete(proof.k);
  res.json({ ok: true, user: rowToUser(updated[0], true), token: sessionFor(updated[0]) });
}));

// Directory of users (search). Other people's email/phone are masked.
app.get('/api/users', needDb, needAuth, wrap(async (req, res) => {
  const since = typeof req.query.since === 'string' ? req.query.since : '';
  const filter = since ? `&updated_at=gte.${enc(since)}` : '';
  const rows = await sb('GET', 'konekta_users', { query: `?select=*&order=updated_at.asc&limit=1000${filter}` });
  const cursor = rows.length ? rows[rows.length - 1].updated_at : since || null;
  res.json({ ok: true, users: rows.map((r) => rowToUser(r, r.id === req.uid)), cursor });
}));

app.put('/api/me', needDb, needAuth, wrap(async (req, res) => {
  const b = req.body || {};
  const patch = { updated_at: new Date().toISOString() };
  if (b.firstName !== undefined) { const v = str(b.firstName, 50); if (!v) return res.status(400).json({ ok: false, error: 'Kulang ang pangalan.' }); patch.first_name = v; }
  if (b.lastName !== undefined) { const v = str(b.lastName, 50); if (!v) return res.status(400).json({ ok: false, error: 'Kulang ang apelyido.' }); patch.last_name = v; }
  if (b.gender !== undefined && GENDERS.includes(b.gender)) patch.gender = b.gender;
  if (b.avatar !== undefined) patch.avatar = str(b.avatar, 5_000_000);
  if (b.coverPhoto !== undefined) patch.cover_photo = str(b.coverPhoto, 5_000_000);
  if (b.bio !== undefined) patch.bio = str(b.bio, 500);
  if (b.birthday !== undefined) patch.birthday = str(b.birthday, 30) || null;
  if (b.location !== undefined) patch.location = str(b.location, 120);
  if (b.work !== undefined) patch.work = str(b.work, 120);
  const updated = await sb('PATCH', 'konekta_users', { query: `?id=eq.${enc(req.uid)}`, body: patch, prefer: 'return=representation' });
  if (!updated || !updated[0]) return res.status(404).json({ ok: false, error: 'Hindi nahanap ang account.' });
  res.json({ ok: true, user: rowToUser(updated[0], true) });
}));

app.get('/api/friends', needDb, needAuth, wrap(async (req, res) => {
  const me = enc(req.uid);
  const [friends, sent, received] = await Promise.all([
    sb('GET', 'konekta_friends', { query: `?user_id=eq.${me}&select=friend_id` }),
    sb('GET', 'konekta_friend_requests', { query: `?from_id=eq.${me}&select=to_id` }),
    sb('GET', 'konekta_friend_requests', { query: `?to_id=eq.${me}&select=from_id` }),
  ]);
  res.json({
    ok: true,
    friends: friends.map((r) => r.friend_id),
    sent: sent.map((r) => r.to_id),
    received: received.map((r) => r.from_id),
  });
}));

const pairFilter = (a, b, c1, c2) =>
  `?or=(and(${c1}.eq.${a},${c2}.eq.${b}),and(${c1}.eq.${b},${c2}.eq.${a}))`;

app.post('/api/friends/:action', needDb, needAuth, wrap(async (req, res) => {
  const me = req.uid;
  const action = req.params.action;
  const other = req.body?.to || req.body?.from || req.body?.target;
  if (!['request', 'cancel', 'accept', 'unfriend'].includes(action)) return res.status(404).json({ ok: false, error: 'Hindi alam na aksyon.' });
  if (typeof other !== 'string' || !SAFE_ID.test(other) || other === me) return res.status(400).json({ ok: false, error: 'Maling user.' });

  if (action === 'request') {
    const target = await sb('GET', 'konekta_users', { query: `?id=eq.${enc(other)}&select=id&limit=1` });
    if (!target.length) return res.status(404).json({ ok: false, error: 'Hindi nahanap ang user.' });
    const already = await sb('GET', 'konekta_friends', { query: `?user_id=eq.${enc(me)}&friend_id=eq.${enc(other)}&select=user_id&limit=1` });
    if (!already.length) {
      await sb('POST', 'konekta_friend_requests', {
        query: '?on_conflict=from_id,to_id',
        body: { from_id: me, to_id: other },
        prefer: 'resolution=ignore-duplicates,return=minimal',
      });
      await notify(other, me, 'friend_request', 'ay nagpadala sa iyo ng friend request.', me);
    }
  } else if (action === 'cancel') {
    // also lets the receiver decline a request
    await sb('DELETE', 'konekta_friend_requests', { query: pairFilter(me, other, 'from_id', 'to_id'), prefer: 'return=minimal' });
  } else if (action === 'accept') {
    const pending = await sb('GET', 'konekta_friend_requests', { query: `?from_id=eq.${enc(other)}&to_id=eq.${enc(me)}&select=from_id&limit=1` });
    if (!pending.length) return res.status(404).json({ ok: false, error: 'Wala nang friend request.' });
    await sb('POST', 'konekta_friends', {
      query: '?on_conflict=user_id,friend_id',
      body: [{ user_id: me, friend_id: other }, { user_id: other, friend_id: me }],
      prefer: 'resolution=ignore-duplicates,return=minimal',
    });
    await sb('DELETE', 'konekta_friend_requests', { query: pairFilter(me, other, 'from_id', 'to_id'), prefer: 'return=minimal' });
    await notify(other, me, 'friend_accept', 'ay tinanggap ang iyong friend request.', me);
  } else if (action === 'unfriend') {
    await sb('DELETE', 'konekta_friends', { query: pairFilter(me, other, 'user_id', 'friend_id'), prefer: 'return=minimal' });
  }
  res.json({ ok: true });
}));


// ---------------------------------------------------------------------------
// Posts, comments, reactions, stories, chat, notifications
// ---------------------------------------------------------------------------
const REACTIONS = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
const idOr = (v, prefix) => (typeof v === 'string' && SAFE_ID.test(v) ? v : `${prefix}_${crypto.randomBytes(8).toString('hex')}`);
const inList = (ids) => ids.map((i) => enc(i)).join(',');

async function myFriendIds(uid) {
  const rows = await sb('GET', 'konekta_friends', { query: `?user_id=eq.${enc(uid)}&select=friend_id` });
  return rows.map((r) => r.friend_id);
}

async function notify(userId, actorId, type, message, targetId) {
  if (!userId || userId === actorId) return;
  try {
    await sb('POST', 'konekta_notifications', {
      body: { id: idOr(null, 'n'), user_id: userId, actor_id: actorId || null, type, target_id: targetId || null, message },
      prefer: 'return=minimal',
    });
  } catch (err) {
    console.error('notify failed:', err.message);
  }
}

// ---- Feed ----
app.get('/api/feed', needDb, needAuth, wrap(async (req, res) => {
  const me = req.uid;
  const since = typeof req.query.since === 'string' ? req.query.since : '';
  const friends = await myFriendIds(me);
  const vis = ['privacy.eq.public', `user_id.eq.${enc(me)}`];
  if (friends.length) vis.push(`and(privacy.eq.friends,user_id.in.(${inList(friends)}))`);

  let query = `?select=*&or=(${vis.join(',')})`;
  query += since
    ? `&updated_at=gte.${enc(since)}&order=updated_at.asc&limit=300`
    : '&deleted=eq.false&order=created_at.desc&limit=100';
  const rows = await sb('GET', 'konekta_posts', { query });

  const live = rows.filter((r) => !r.deleted);
  const ids = live.map((r) => r.id);
  let reactions = [], comments = [];
  if (ids.length) {
    [reactions, comments] = await Promise.all([
      sb('GET', 'konekta_post_reactions', { query: `?post_id=in.(${inList(ids)})&select=post_id,user_id,type` }),
      sb('GET', 'konekta_comments', { query: `?post_id=in.(${inList(ids)})&select=*&order=created_at.asc` }),
    ]);
  }
  const posts = rows.map((r) => {
    if (r.deleted) return { id: r.id, deleted: true };
    const counts = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
    const userReactions = {};
    reactions.filter((x) => x.post_id === r.id).forEach((x) => {
      if (counts[x.type] !== undefined) counts[x.type] += 1;
      userReactions[x.user_id] = x.type;
    });
    return {
      id: r.id,
      userId: r.user_id,
      content: r.content,
      imageUrl: r.image_url || undefined,
      backgroundColor: r.background_color || undefined,
      feeling: r.feeling || undefined,
      location: r.location || undefined,
      privacy: r.privacy,
      sharesCount: r.shares_count || 0,
      createdAt: r.created_at,
      reactions: counts,
      userReactions,
      comments: comments.filter((c) => c.post_id === r.id).map((c) => ({
        id: c.id, postId: c.post_id, userId: c.user_id, text: c.text, createdAt: c.created_at, likes: 0,
      })),
    };
  });
  const cursor = rows.length ? rows.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), '') : since || null;
  res.json({ ok: true, posts, cursor });
}));

app.post('/api/posts', needDb, needAuth, wrap(async (req, res) => {
  const b = req.body || {};
  const content = str(b.content, 5000);
  const imageUrl = str(b.imageUrl, 5_000_000);
  if (!content && !imageUrl) return res.status(400).json({ ok: false, error: 'Walang laman ang post.' });
  const row = {
    id: idOr(b.id, 'post'),
    user_id: req.uid,
    content,
    image_url: imageUrl || null,
    background_color: str(b.backgroundColor, 200) || null,
    feeling: str(b.feeling, 100) || null,
    location: str(b.location, 120) || null,
    privacy: ['public', 'friends', 'only_me'].includes(b.privacy) ? b.privacy : 'public',
  };
  try {
    await sb('POST', 'konekta_posts', { body: row, prefer: 'return=minimal' });
  } catch (err) {
    if (err.status !== 409) throw err; // same id sent twice: already saved
  }
  res.json({ ok: true, id: row.id });
}));

const touchPost = (postId) =>
  sb('PATCH', 'konekta_posts', { query: `?id=eq.${enc(postId)}`, body: { updated_at: new Date().toISOString() }, prefer: 'return=minimal' });

app.post('/api/posts/:id/delete', needDb, needAuth, wrap(async (req, res) => {
  if (!SAFE_ID.test(req.params.id)) return res.status(400).json({ ok: false, error: 'Maling post.' });
  await sb('PATCH', 'konekta_posts', {
    query: `?id=eq.${enc(req.params.id)}&user_id=eq.${enc(req.uid)}`,
    body: { deleted: true, updated_at: new Date().toISOString() },
    prefer: 'return=minimal',
  });
  res.json({ ok: true });
}));

app.post('/api/posts/:id/react', needDb, needAuth, wrap(async (req, res) => {
  const postId = req.params.id;
  const type = req.body?.type;
  if (!SAFE_ID.test(postId) || !REACTIONS.includes(type)) return res.status(400).json({ ok: false, error: 'Maling reaction.' });
  const post = await sb('GET', 'konekta_posts', { query: `?id=eq.${enc(postId)}&deleted=eq.false&select=id,user_id&limit=1` });
  if (!post.length) return res.status(404).json({ ok: false, error: 'Wala na ang post.' });
  const mine = await sb('GET', 'konekta_post_reactions', { query: `?post_id=eq.${enc(postId)}&user_id=eq.${enc(req.uid)}&select=type&limit=1` });
  if (mine.length && mine[0].type === type) {
    await sb('DELETE', 'konekta_post_reactions', { query: `?post_id=eq.${enc(postId)}&user_id=eq.${enc(req.uid)}`, prefer: 'return=minimal' });
  } else {
    await sb('POST', 'konekta_post_reactions', {
      query: '?on_conflict=post_id,user_id',
      body: { post_id: postId, user_id: req.uid, type },
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    if (!mine.length) await notify(post[0].user_id, req.uid, 'like', 'nag-react sa iyong post.', postId);
  }
  await touchPost(postId);
  res.json({ ok: true });
}));

app.post('/api/posts/:id/comment', needDb, needAuth, wrap(async (req, res) => {
  const postId = req.params.id;
  const text = str(req.body?.text, 2000);
  if (!SAFE_ID.test(postId) || !text) return res.status(400).json({ ok: false, error: 'Walang laman ang komento.' });
  const post = await sb('GET', 'konekta_posts', { query: `?id=eq.${enc(postId)}&deleted=eq.false&select=id,user_id&limit=1` });
  if (!post.length) return res.status(404).json({ ok: false, error: 'Wala na ang post.' });
  try {
    await sb('POST', 'konekta_comments', {
      body: { id: idOr(req.body?.id, 'c'), post_id: postId, user_id: req.uid, text },
      prefer: 'return=minimal',
    });
  } catch (err) {
    if (err.status !== 409) throw err;
  }
  await touchPost(postId);
  await notify(post[0].user_id, req.uid, 'comment', `nagkomento sa iyong post: "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`, postId);
  res.json({ ok: true });
}));

// ---- Stories (me + friends, last 24 hours) ----
app.get('/api/stories', needDb, needAuth, wrap(async (req, res) => {
  const friends = await myFriendIds(req.uid);
  const who = [`user_id.eq.${enc(req.uid)}`];
  if (friends.length) who.push(`user_id.in.(${inList(friends)})`);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await sb('GET', 'konekta_stories', {
    query: `?select=*&or=(${who.join(',')})&created_at=gte.${enc(cutoff)}&order=created_at.desc&limit=100`,
  });
  res.json({
    ok: true,
    stories: rows.map((r) => ({ id: r.id, userId: r.user_id, mediaUrl: r.media_url, caption: r.caption || undefined, createdAt: r.created_at })),
  });
}));

app.post('/api/stories', needDb, needAuth, wrap(async (req, res) => {
  const mediaUrl = str(req.body?.mediaUrl, 5_000_000);
  if (!mediaUrl) return res.status(400).json({ ok: false, error: 'Walang media ang story.' });
  try {
    await sb('POST', 'konekta_stories', {
      body: { id: idOr(req.body?.id, 'story'), user_id: req.uid, media_url: mediaUrl, caption: str(req.body?.caption, 300) || null },
      prefer: 'return=minimal',
    });
  } catch (err) {
    if (err.status !== 409) throw err;
  }
  res.json({ ok: true });
}));

// ---- Chat ----
app.get('/api/messages', needDb, needAuth, wrap(async (req, res) => {
  const me = enc(req.uid);
  const since = typeof req.query.since === 'string' ? req.query.since : '';
  const mine = `or=(sender_id.eq.${me},recipient_id.eq.${me})`;
  const query = since
    ? `?select=*&${mine}&updated_at=gte.${enc(since)}&order=updated_at.asc&limit=500`
    : `?select=*&${mine}&order=created_at.desc&limit=500`;
  const rows = await sb('GET', 'konekta_messages', { query });
  const cursor = rows.length ? rows.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), '') : since || null;
  res.json({
    ok: true,
    cursor,
    messages: rows.map((r) => ({
      id: r.id, senderId: r.sender_id, recipientId: r.recipient_id, text: r.text,
      imageUrl: r.image_url || undefined, isRead: !!r.is_read, createdAt: r.created_at,
    })),
  });
}));

app.post('/api/messages', needDb, needAuth, wrap(async (req, res) => {
  const to = req.body?.to;
  const text = str(req.body?.text, 4000);
  const imageUrl = str(req.body?.imageUrl, 5_000_000);
  if (typeof to !== 'string' || !SAFE_ID.test(to) || to === req.uid) return res.status(400).json({ ok: false, error: 'Maling tatanggap.' });
  if (!text && !imageUrl) return res.status(400).json({ ok: false, error: 'Walang laman ang mensahe.' });
  const target = await sb('GET', 'konekta_users', { query: `?id=eq.${enc(to)}&select=id&limit=1` });
  if (!target.length) return res.status(404).json({ ok: false, error: 'Hindi nahanap ang user.' });
  try {
    await sb('POST', 'konekta_messages', {
      body: { id: idOr(req.body?.id, 'm'), sender_id: req.uid, recipient_id: to, text, image_url: imageUrl || null },
      prefer: 'return=minimal',
    });
  } catch (err) {
    if (err.status !== 409) throw err;
  }
  res.json({ ok: true });
}));

app.post('/api/messages/read', needDb, needAuth, wrap(async (req, res) => {
  const other = req.body?.with;
  if (typeof other !== 'string' || !SAFE_ID.test(other)) return res.status(400).json({ ok: false, error: 'Maling user.' });
  await sb('PATCH', 'konekta_messages', {
    query: `?sender_id=eq.${enc(other)}&recipient_id=eq.${enc(req.uid)}&is_read=eq.false`,
    body: { is_read: true, updated_at: new Date().toISOString() },
    prefer: 'return=minimal',
  });
  res.json({ ok: true });
}));

// ---- Notifications ----
app.get('/api/notifications', needDb, needAuth, wrap(async (req, res) => {
  const rows = await sb('GET', 'konekta_notifications', { query: `?user_id=eq.${enc(req.uid)}&select=*&order=created_at.desc&limit=100` });
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  let actors = [];
  if (actorIds.length) actors = await sb('GET', 'konekta_users', { query: `?id=in.(${inList(actorIds)})&select=id,first_name,last_name` });
  const nameOf = new Map(actors.map((a) => [a.id, `${a.first_name} ${a.last_name}`]));
  res.json({
    ok: true,
    notifications: rows.map((r) => ({
      id: r.id, userId: r.user_id, type: r.type, actorId: r.actor_id || null,
      actorName: r.actor_id ? nameOf.get(r.actor_id) || 'Konekta User' : 'Konekta',
      targetId: r.target_id || undefined, message: r.message, isRead: !!r.is_read, createdAt: r.created_at,
    })),
  });
}));

app.post('/api/notifications/read', needDb, needAuth, wrap(async (req, res) => {
  await sb('PATCH', 'konekta_notifications', { query: `?user_id=eq.${enc(req.uid)}&is_read=eq.false`, body: { is_read: true }, prefer: 'return=minimal' });
  res.json({ ok: true });
}));

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all routes to index.html for Single Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Konekta production server is running on port ${PORT}`);
});

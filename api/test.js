// «Yurist va Kadr» — jonli test oʻyini serveri (Vercel funksiyasi).
// Maʼlumotlar Upstash Redis'da saqlanadi (Vercel → Storage → Upstash for Redis).
// Kerakli sozlamalar Vercel ulaganda oʻzi qoʻshiladi:
//   KV_REST_API_URL va KV_REST_API_TOKEN  (yoki UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
// Toʻgʻri javoblar faqat shu yerda turadi — sahifada koʻrinmaydi.

const KEY = [1, 2, 0, 1, 3, 2, 1, 2, 1, 0, 2, 0, 1, 2, 0, 1, 0, 1, 2, 1, 3, 2, 3, 2, 0, 3, 1, 2, 3, 1];
const N = KEY.length;
const DUR = 20000;               // har bir savolga 20 soniya
const TOTAL = N * DUR;           // eng koʻpi bilan 10 daqiqa
const TTL = 3 * 24 * 3600;       // oʻyin maʼlumotlari 3 kun saqlanadi

const RURL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const RTOK = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

async function redis(cmds) {
  const r = await fetch(RURL().replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RTOK(), 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('Redis ' + r.status);
  const j = await r.json();
  return j.map((x) => { if (x && x.error) throw new Error(x.error); return x ? x.result : null; });
}

const clean = (v, max) => String(v ?? '').replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const rand = (n) => { const a = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };
const K = (code) => ({ s: `t:${code}:s`, p: `t:${code}:p`, a: `t:${code}:a` });
const pairs = (arr) => { const o = {}; for (let i = 0; i + 1 < (arr || []).length; i += 2) o[arr[i]] = arr[i + 1]; return o; };
const strip = (rows, me) => (rows || []).map((r) => ({ n: r.n, s: r.s, t: r.t, d: r.d, me: me && r.k === me ? 1 : undefined }));
const pub = (st) => (st ? { ph: st.ph, s: st.s || 0, n: N, dur: DUR } : null);

function board(players, answers) {
  const rows = {};
  for (const k in players) rows[k] = { k, n: players[k], s: 0, t: 0, d: 0 };
  for (const f in answers) {
    const [k, i] = f.split('|'); const r = rows[k]; if (!r) continue;
    const [c, ms] = String(answers[f]).split('|').map(Number);
    r.d++;
    if (c === KEY[+i]) { r.s++; r.t += Math.max(0, Math.min(DUR, ms || DUR)); }
  }
  return Object.values(rows).sort((a, b) => b.s - a.s || a.t - b.t || a.n.localeCompare(b.n));
}

async function load(code) {
  const k = K(code);
  const [s, p, a] = await redis([['GET', k.s], ['HGETALL', k.p], ['HGETALL', k.a]]);
  return { st: s ? JSON.parse(s) : null, players: pairs(p), answers: pairs(a) };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const send = (code, data) => res.status(code).json({ now: Date.now(), ...data });
  const fail = (code, message) => send(code, { ok: false, message });
  if (!RURL() || !RTOK()) return fail(503, 'Baza ulanmagan: Vercel → Storage → Upstash for Redis ni loyihaga ulang.');

  const q = req.query || {};
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  const op = String(q.op || '');
  const code = String(b.code ?? q.code ?? '');
  if (op !== 'create' && op !== 'ping' && !/^\d{4}$/.test(code)) return fail(400, 'Kod notoʻgʻri');
  const k = K(code);

  try {
    if (op === 'ping') return send(200, { ok: true });

    if (op === 'create') {
      if (req.method !== 'POST') return fail(405, 'POST');
      for (let t = 0; t < 10; t++) {
        const c = String(1000 + Math.floor(Math.random() * 9000));
        const token = rand(24);
        const st = { ph: 'lobby', s: 0, h: token, at: Date.now() };
        const [ok] = await redis([['SET', `t:${c}:s`, JSON.stringify(st), 'NX', 'EX', TTL]]);
        if (ok) return send(200, { ok: true, code: c, token });
      }
      return fail(503, 'Kod topilmadi, qayta urinib koʻring');
    }

    if (op === 'state') {
      const [s] = await redis([['GET', k.s]]);
      if (!s) return fail(404, 'Bunday kodli oʻyin topilmadi');
      return send(200, { ok: true, state: pub(JSON.parse(s)) });
    }

    if (op === 'board') {
      const { st, players, answers } = await load(code);
      if (!st) return fail(404, 'Oʻyin topilmadi');
      const rows = st.ph === 'final' ? st.board || [] : board(players, answers);
      return send(200, { ok: true, state: pub(st), board: strip(rows, String(q.k || '')) });
    }

    if (req.method !== 'POST') return fail(405, 'POST');

    if (op === 'join') {
      const pk = String(b.k || ''), name = clean(b.n, 50);
      if (!/^[a-z0-9]{6,16}$/.test(pk)) return fail(400, 'Kalit notoʻgʻri');
      if (name.length < 4) return fail(400, 'Ism va familiyani toʻliq yozing');
      const [s] = await redis([['GET', k.s]]);
      if (!s) return fail(404, 'Bunday kodli oʻyin topilmadi');
      const st = JSON.parse(s);
      if (st.ph === 'final') return fail(409, 'Bu oʻyin yakunlangan');
      await redis([['HSET', k.p, pk, name], ['EXPIRE', k.p, TTL]]);
      return send(200, { ok: true, state: pub(st) });
    }

    if (op === 'answer') {
      const pk = String(b.k || ''), i = Number(b.i), c = Number(b.c), ms = Math.round(Number(b.ms));
      if (!/^[a-z0-9]{6,16}$/.test(pk) || !Number.isInteger(i) || i < 0 || i >= N || !Number.isInteger(c) || c < -1 || c > 3) return fail(400, 'Notoʻgʻri soʻrov');
      const [s, member] = await redis([['GET', k.s], ['HEXISTS', k.p, pk]]);
      if (!s) return fail(404, 'Oʻyin topilmadi');
      const st = JSON.parse(s);
      if (!member) return fail(403, 'Siz roʻyxatda yoʻqsiz');
      const now = Date.now();
      if (st.ph !== 'run' || now < st.s - 2000 || now > st.s + TOTAL + 15000) return fail(409, 'Vaqt tugagan');
      const t = Math.max(0, Math.min(DUR, Number.isFinite(ms) ? ms : DUR));
      const [added] = await redis([['HSETNX', k.a, `${pk}|${i}`, `${c}|${t}`], ['EXPIRE', k.a, TTL]]);
      return send(200, { ok: true, right: c === KEY[i], dup: !added });
    }

    // ---- o'qituvchi amallari (token bilan) ----
    const { st, players, answers } = await load(code);
    if (!st) return fail(404, 'Oʻyin topilmadi');
    if (!b.token || b.token !== st.h) return fail(403, 'Ruxsat yoʻq');
    const save = (next) => redis([['SET', k.s, JSON.stringify(next), 'EX', TTL]]);

    if (op === 'live') {
      const rows = st.ph === 'final' ? st.board || [] : board(players, answers);
      return send(200, { ok: true, state: pub(st), board: rows, players: Object.keys(players).map((pk) => ({ k: pk, n: players[pk] })) });
    }
    if (op === 'start') {
      if (st.ph !== 'lobby') return send(200, { ok: true, state: pub(st) });
      const next = { ...st, ph: 'run', s: Date.now() + 3000 };
      await save(next); return send(200, { ok: true, state: pub(next) });
    }
    if (op === 'end') {
      if (st.ph === 'final') return send(200, { ok: true, state: pub(st) });
      const next = { ...st, ph: 'final', board: board(players, answers) };
      await save(next); return send(200, { ok: true, state: pub(next) });
    }
    if (op === 'kick') {
      const pk = String(b.k || '');
      await redis([['HDEL', k.p, pk]]);
      return send(200, { ok: true });
    }
    return fail(400, 'Nomaʼlum amal');
  } catch (e) {
    return fail(500, 'Server xatosi: ' + (e && e.message ? e.message : e));
  }
}

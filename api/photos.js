// «Yurist va Kadr» — Telegram kanallaridan «Markaz hayoti» uchun rasmlarni olib beradi (Vercel funksiyasi).
// Faqat dars, test, sertifikat topshirish va seminarlar haqidagi postlarning rasmlari olinadi.
// Natija Vercel CDN'da 30 daqiqa saqlanadi.

import { readIndex } from './_gallery.js';

const CHANNELS = ['kadr_yurist', 'yuristkadr'];
const PAGES = 5;      // har bir kanaldan nechta sahifa (~20 post) koʻrib chiqiladi
const LIMIT = 16;     // jami nechta rasm qaytariladi

// Postda shulardan biri boʻlsa — markaz hayotiga oid (lotin va kirill)
const TOPICS = [
  { cat: 'sert', label: 'Sertifikat', re: /sertifikat|сертификат/i },
  { cat: 'test', label: 'Yakuniy test', re: /yakuniy test|test topshir|якуний тест|тест топшир/i },
  { cat: 'sem',  label: 'Seminar', re: /seminar|семинар|trening|тренинг/i },
  { cat: 'dars', label: 'Dars jarayoni', re: /dars jarayon|darslar|mashg.ulot|tinglovchi|guruh bilan|дарс жараён|дарслар|машғулот|тингловчи|гуруҳ билан|марказимизда/i },
];
// Reklama/eʼlon postlari olinmaydi
const SKIP = /ro.yxatga olish|ro.yxatdan o.tish boshlandi|taklif qilamiz|рўйхатга олиш|рўйҳатга олиш|таклиф қиламиз|chegirma|чегирма/i;

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e.toLowerCase()] ?? m));
const toText = (h) => decode(h.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/\s+\n/g, '\n').trim();

function caption(text) {
  const line = text.split('\n').map((l) => l.replace(/[#@]\S+/g, '').replace(/[^\p{L}\p{N}\s«»"'‘’ʻʼ.,:;!?()–—-]/gu, '').trim()).find((l) => l.length > 8) || '';
  return line.length > 80 ? line.slice(0, 77).replace(/\s+\S*$/, '') + '…' : line;
}

function parse(html, ch) {
  const out = [];
  let minId = Infinity;
  for (const part of html.split('<div class="tgme_widget_message_wrap').slice(1)) {
    const id = (part.match(/data-post="([^"]+)"/) || [])[1];
    if (!id) continue;
    const num = parseInt(id.split('/')[1], 10);
    if (num < minId) minId = num;
    const imgs = [...part.matchAll(/class="(?:tgme_widget_message_photo_wrap|tgme_widget_message_video_thumb)[^"]*"[^>]*?style="[^"]*background-image:url\('([^']+)'\)/g)].map((m) => m[1]);
    if (!imgs.length) continue;
    const tm = part.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const text = tm ? toText(tm[1]) : '';
    if (!text || SKIP.test(text)) continue;
    const topic = TOPICS.find((t) => t.re.test(text));
    if (!topic) continue;
    const date = (part.match(/<time datetime="([^"]+)"/) || [])[1] || '';
    imgs.slice(0, 4).forEach((src, i) => out.push({ id: id + (i ? '#' + i : ''), url: 'https://t.me/' + id, img: src, cat: topic.cat, label: topic.label, caption: caption(text), date }));
  }
  return { items: out, minId };
}

async function channel(ch) {
  const all = [];
  let before = '';
  for (let p = 0; p < PAGES; p++) {
    const r = await fetch('https://t.me/s/' + ch + (before ? '?before=' + before : ''), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YuristKadrSite/1.0)', 'Accept-Language': 'uz,ru;q=0.8' },
    });
    if (!r.ok) break;
    const { items, minId } = parse(await r.text(), ch);
    all.push(...items);
    if (!isFinite(minId) || minId <= 1) break;
    before = String(minId);
  }
  return all;
}

export default async function handler(req, res) {
  const [group, ...lists] = await Promise.all([
    // Yopiq guruhdan #sayt bilan yuborilgan rasmlar (Vercel Blob ulangan boʻlsa)
    process.env.BLOB_READ_WRITE_TOKEN ? readIndex().then((x) => (x.photos || []).map((p) => ({ ...p, url: p.img }))).catch(() => []) : Promise.resolve([]),
    ...CHANNELS.map((c) => channel(c).catch(() => [])),
  ]);
  const seen = new Set();
  const photos = [...group, ...lists.flat()]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .filter((p) => (seen.has(p.img) ? false : seen.add(p.img)))
    .slice(0, LIMIT);
  res.setHeader('Cache-Control', photos.length ? 'public, s-maxage=1800, stale-while-revalidate=86400' : 'no-store');
  return res.status(200).json({ updated: new Date().toISOString(), photos });
}

export { parse as _parse };

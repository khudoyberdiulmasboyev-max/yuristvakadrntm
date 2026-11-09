// «Yurist va Kadr» — Telegram kanallaridagi soʻnggi postlarni saytga olib beradi (Vercel funksiyasi).
// Kanallar ochiq, shuning uchun token kerak emas: t.me/s/<kanal> sahifasi oʻqiladi.
// Natija Vercel CDN'da 15 daqiqa saqlanadi.

const CHANNELS = ['kadr_yurist', 'yuristkadr']; // kanal nomlari (@ belgisisiz)
const PER_CHAN = 12;                            // har bir kanaldan nechta post
const MIN_TEXT = 40;                            // juda qisqa postlar chiqmasin

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENT[e.toLowerCase()] ?? m;
  });
}
function htmlToText(h) {
  return decode(
    h.replace(/<br\s*\/?>/gi, '\n')
     .replace(/<\/(p|div|blockquote)>/gi, '\n')
     .replace(/<[^>]+>/g, '')
  ).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Xabar matni bloki ichida ichma-ich <div> boʻlishi mumkin — yopilish tegini sanab topamiz
function innerDiv(html, start) {
  const open = html.indexOf('>', start) + 1;
  let depth = 1, i = open;
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = open;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(open, m.index);
    i = re.lastIndex;
  }
  return html.slice(open);
}

async function parseChannel(ch) {
  const r = await fetch('https://t.me/s/' + encodeURIComponent(ch), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YuristKadrSite/1.0)', 'Accept-Language': 'uz,ru;q=0.8,en;q=0.6' },
  });
  if (!r.ok) return null;
  const html = await r.text();
  const parts = html.split('<div class="tgme_widget_message_wrap').slice(1);
  const posts = [];
  for (const part of parts) {
    const id = (part.match(/data-post="([^"]+)"/) || [])[1];
    if (!id) continue;
    const ti = part.search(/<div class="tgme_widget_message_text[^"]*"/);
    const text = ti >= 0 ? htmlToText(innerDiv(part, ti)) : '';
    if (text.length < MIN_TEXT) continue;
    const imgM = part.match(/class="(?:tgme_widget_message_photo_wrap|tgme_widget_message_video_thumb|link_preview_image)[^"]*"[^>]*style="[^"]*url\('([^']+)'\)/);
    const date = (part.match(/<time datetime="([^"]+)"/) || [])[1] || '';
    posts.push({ id, channel: ch, url: 'https://t.me/' + id, date, text: text.slice(0, 700), img: imgM ? imgM[1] : '' });
  }
  return posts.reverse().slice(0, PER_CHAN);
}

export default async function handler(req, res) {
  const results = await Promise.all(CHANNELS.map((c) => parseChannel(c).catch(() => null)));
  const ok = results.some((r) => r !== null);
  if (!ok) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ posts: [] }); // sayt oʻzi zaxira nusxani (posts.json) koʻrsatadi
  }
  const posts = results.flat().filter(Boolean).sort((a, b) => (a.date < b.date ? 1 : -1));
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
  return res.status(200).json({ updated: new Date().toISOString(), posts });
}

// Test uchun (Vercel buni eʼtiborsiz qoldiradi)
export { parseChannel as _parseChannel, htmlToText as _htmlToText, innerDiv as _innerDiv };

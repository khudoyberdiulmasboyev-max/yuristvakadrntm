// Bir martalik sozlash: https://SAYT/api/tg-setup?key=<TG_HOOK_SECRET>
// Rasmlar botini shu saytga ulaydi (Telegram webhook).
export default async function handler(req, res) {
  const TOKEN = process.env.GALLERY_BOT_TOKEN;
  const SECRET = process.env.TG_HOOK_SECRET;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  if (!TOKEN || !SECRET) return res.status(500).send('GALLERY_BOT_TOKEN va TG_HOOK_SECRET sozlamalari Vercelʼda kiritilmagan.');
  if (req.query.key !== SECRET) return res.status(401).send('Kalit notoʻgʻri.');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = `https://${host}/api/tg-hook`;
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret_token: SECRET, allowed_updates: ['message', 'edited_message', 'channel_post'] }),
  }).then((x) => x.json()).catch((e) => ({ ok: false, description: String(e) }));
  const me = await fetch(`https://api.telegram.org/bot${TOKEN}/getMe`).then((x) => x.json()).catch(() => ({}));
  const blob = process.env.BLOB_READ_WRITE_TOKEN ? 'ulangan ✓' : 'ULANMAGAN ✗ (Vercel → Storage → Blob)';
  const groups = process.env.GROUP_CHAT_IDS || 'kiritilmagan ✗ (guruhda /id yozing)';
  return res.status(r.ok ? 200 : 500).send(
    (r.ok ? 'Tayyor ✓ Bot saytga ulandi.' : 'Xato: ' + (r.description || 'nomaʼlum')) +
    `\n\nBot: @${(me.result || {}).username || '?'}\nManzil: ${url}\nBlob ombori: ${blob}\nGuruh ID: ${groups}`);
}
